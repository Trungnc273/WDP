function normalizeCategoryName(rawCategory) {
  if (!rawCategory) return '';

  if (typeof rawCategory === 'string') {
    const value = rawCategory.trim();
    if (!value) return '';

    // Bo qua chuoi ObjectId thuong vi day khong phai nhan hien thi cho nguoi dung.
    if (/^[a-f0-9]{24}$/i.test(value)) {
      return '';
    }

    return value;
  }

  const fromObject = String(rawCategory.name || rawCategory.slug || '').trim();
  return fromObject;
}

export function collectCategoryNames(entity) {
  // Gom toan bo nguon category: category chinh + categories phu + otherCategory.
  const names = [];
  const seen = new Set();

  const pushName = (value) => {
    const normalized = normalizeCategoryName(value);
    if (!normalized) return;
    const key = normalized.toLowerCase();
    if (seen.has(key)) return;
    // Loai bo trung lap khong phan biet hoa thuong de UI gon gon.
    seen.add(key);
    names.push(normalized);
  };

  pushName(entity?.category);

  if (Array.isArray(entity?.categories)) {
    entity.categories.forEach(pushName);
  }

  const otherCategory = String(entity?.otherCategory || '').trim();
  if (otherCategory) {
    pushName(`Khác: ${otherCategory}`);
  }

  return names;
}

export function formatCategoryText(entity, fallback = 'Chưa phân loại') {
  // Ham hien thi dung chung cho tat ca man hinh can chuoi danh muc.
  const names = collectCategoryNames(entity);
  return names.length > 0 ? names.join(', ') : fallback;
}
