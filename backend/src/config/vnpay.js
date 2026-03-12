function getVNPayConfig() {
	return {
		tmnCode: process.env.VNPAY_TMN_CODE || process.env.VNP_TMN_CODE || 'DEMO',
		hashSecret: process.env.VNPAY_HASH_SECRET || process.env.VNP_HASH_SECRET || 'DEMOSECRET',
		url: process.env.VNPAY_URL || process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
		returnUrl:
			process.env.VNPAY_RETURN_URL ||
			process.env.VNP_RETURN_URL ||
			'http://localhost:5000/api/payments/vnpay/return'
	};
}

module.exports = {
	getVNPayConfig
};
