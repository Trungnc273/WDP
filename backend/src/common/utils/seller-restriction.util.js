const Product = require('../../modules/products/product.model');

function getSellingRestrictionMessage(user) {
  const restrictedUntilText = user?.sellingRestrictedUntil
    ? ` đến ${new Date(user.sellingRestrictedUntil).toLocaleString('vi-VN')}`
    : '';
  const reasonText = user?.sellingRestrictedReason
    ? ` Lý do: ${user.sellingRestrictedReason}`
    : ' Lý do: vi phạm chính sách của hệ thống.';

  return `Tài khoản đang bị hạn chế quyền bán${restrictedUntilText}.${reasonText}`;
}

function isSellingRestrictionExpired(user) {
  return Boolean(
    user?.isSellingRestricted &&
    user?.sellingRestrictedUntil &&
    new Date(user.sellingRestrictedUntil) <= new Date()
  );
}

async function clearSellingRestriction(user, options = {}) {
  if (!user) return user;

  user.isSellingRestricted = false;
  user.sellingRestrictedUntil = undefined;
  user.sellingRestrictedReason = undefined;
  user.sellingRestrictionSource = undefined;

  if (options.save !== false) {
    await user.save();
  }

  return user;
}

async function refreshSellingRestriction(user, options = {}) {
  if (!user?.isSellingRestricted) {
    return false;
  }

  if (isSellingRestrictionExpired(user)) {
    await clearSellingRestriction(user, options);
    return false;
  }

  // Keep public marketplace clean for already-restricted legacy accounts.
  await Product.updateMany(
    {
      seller: user._id,
      status: 'active'
    },
    {
      status: 'hidden'
    }
  );

  return true;
}

async function applySellingRestrictionToUser(user, payload = {}) {
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }

  const {
    until,
    durationMs,
    reason,
    source = 'moderation',
    hideActiveProducts = true
  } = payload;

  let restrictedUntil;
  if (until) {
    restrictedUntil = new Date(until);
  } else if (typeof durationMs === 'number' && durationMs > 0) {
    restrictedUntil = new Date(Date.now() + durationMs);
  }

  user.isSellingRestricted = true;
  user.sellingRestrictedUntil = restrictedUntil;
  user.sellingRestrictedReason = String(reason || '').trim() || 'Tài khoản bị hạn chế quyền bán bởi hệ thống.';
  user.sellingRestrictionSource = String(source || 'moderation').trim();
  await user.save();

  if (hideActiveProducts) {
    await Product.updateMany(
      {
        seller: user._id,
        status: 'active'
      },
      {
        status: 'hidden'
      }
    );
  }

  return user;
}

module.exports = {
  getSellingRestrictionMessage,
  isSellingRestrictionExpired,
  clearSellingRestriction,
  refreshSellingRestriction,
  applySellingRestrictionToUser
};
