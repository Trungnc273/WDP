// Service để lấy dữ liệu địa chỉ Việt Nam
// Sử dụng API miễn phí từ provinces.open-api.vn

const BASE_URL = 'https://provinces.open-api.vn/api';

class LocationService {
  // Lấy danh sách tỉnh/thành phố
  async getProvinces() {
    try {
      const response = await fetch(`${BASE_URL}/p/`);
      const data = await response.json();
      return data.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    } catch (error) {
      console.error('Error fetching provinces:', error);
      return [];
    }
  }

  // Lấy danh sách quận/huyện theo tỉnh
  async getDistricts(provinceCode) {
    try {
      const response = await fetch(`${BASE_URL}/p/${provinceCode}?depth=2`);
      const data = await response.json();
      return data.districts.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    } catch (error) {
      console.error('Error fetching districts:', error);
      return [];
    }
  }

  // Lấy danh sách phường/xã theo quận/huyện
  async getWards(districtCode) {
    try {
      const response = await fetch(`${BASE_URL}/d/${districtCode}?depth=2`);
      const data = await response.json();
      return data.wards.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
    } catch (error) {
      console.error('Error fetching wards:', error);
      return [];
    }
  }
}

export default new LocationService();
