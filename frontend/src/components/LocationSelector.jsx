import React, { useState, useEffect } from 'react';
import locationService from '../services/location.service';
import './LocationSelector.css';

const LocationSelector = ({ value, onChange, errors }) => {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWard, setSelectedWard] = useState(null);

  // Tai danh sach tinh/thanh khi component mount
  useEffect(() => {
    loadProvinces();
  }, []);

  // Tai gia tri co san neu duoc truyen vao
  useEffect(() => {
    if (value?.provinceCode && provinces.length > 0) {
      const province = provinces.find(p => p.code === value.provinceCode);
      if (province) {
        setSelectedProvince(province);
        loadDistricts(province.code);
      }
    }
  }, [value?.provinceCode, provinces]);

  useEffect(() => {
    if (value?.districtCode && districts.length > 0) {
      const district = districts.find(d => d.code === value.districtCode);
      if (district) {
        setSelectedDistrict(district);
        loadWards(district.code);
      }
    }
  }, [value?.districtCode, districts]);

  useEffect(() => {
    if (value?.wardCode && wards.length > 0) {
      const ward = wards.find(w => w.code === value.wardCode);
      if (ward) {
        setSelectedWard(ward);
      }
    }
  }, [value?.wardCode, wards]);

  const loadProvinces = async () => {
    const data = await locationService.getProvinces();
    setProvinces(data);
  };

  const loadDistricts = async (provinceCode) => {
    const data = await locationService.getDistricts(provinceCode);
    setDistricts(data);
  };

  const loadWards = async (districtCode) => {
    const data = await locationService.getWards(districtCode);
    setWards(data);
  };

  const handleProvinceChange = (e) => {
    const code = parseInt(e.target.value);
    const province = provinces.find(p => p.code === code);
    
    setSelectedProvince(province);
    setSelectedDistrict(null);
    setSelectedWard(null);
    setDistricts([]);
    setWards([]);

    if (province) {
      loadDistricts(province.code);
      onChange({
        city: province.name,
        district: '',
        ward: '',
        provinceCode: province.code,
        districtCode: null,
        wardCode: null
      });
    } else {
      onChange({
        city: '',
        district: '',
        ward: '',
        provinceCode: null,
        districtCode: null,
        wardCode: null
      });
    }
  };

  const handleDistrictChange = (e) => {
    const code = parseInt(e.target.value);
    const district = districts.find(d => d.code === code);
    
    setSelectedDistrict(district);
    setSelectedWard(null);
    setWards([]);

    if (district) {
      loadWards(district.code);
      onChange({
        city: selectedProvince.name,
        district: district.name,
        ward: '',
        provinceCode: selectedProvince.code,
        districtCode: district.code,
        wardCode: null
      });
    } else {
      onChange({
        city: selectedProvince.name,
        district: '',
        ward: '',
        provinceCode: selectedProvince.code,
        districtCode: null,
        wardCode: null
      });
    }
  };

  const handleWardChange = (e) => {
    const code = parseInt(e.target.value);
    const ward = wards.find(w => w.code === code);
    
    setSelectedWard(ward);

    if (ward) {
      onChange({
        city: selectedProvince.name,
        district: selectedDistrict.name,
        ward: ward.name,
        provinceCode: selectedProvince.code,
        districtCode: selectedDistrict.code,
        wardCode: ward.code
      });
    } else {
      onChange({
        city: selectedProvince.name,
        district: selectedDistrict.name,
        ward: '',
        provinceCode: selectedProvince.code,
        districtCode: selectedDistrict.code,
        wardCode: null
      });
    }
  };

  return (
    <div className="location-selector">
      <div className="form-group">
        <label htmlFor="province">
          Tỉnh/Thành phố <span className="required">*</span>
        </label>
        <select
          id="province"
          value={selectedProvince?.code || ''}
          onChange={handleProvinceChange}
          className={errors?.city ? 'error' : ''}
        >
          <option value="">-- Chọn Tỉnh/Thành phố --</option>
          {provinces.map(province => (
            <option key={province.code} value={province.code}>
              {province.name}
            </option>
          ))}
        </select>
        {errors?.city && <p className="error-text">{errors.city}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="district">
          Quận/Huyện <span className="required">*</span>
        </label>
        <select
          id="district"
          value={selectedDistrict?.code || ''}
          onChange={handleDistrictChange}
          disabled={!selectedProvince}
          className={errors?.district ? 'error' : ''}
        >
          <option value="">-- Chọn Quận/Huyện --</option>
          {districts.map(district => (
            <option key={district.code} value={district.code}>
              {district.name}
            </option>
          ))}
        </select>
        {errors?.district && <p className="error-text">{errors.district}</p>}
      </div>

      <div className="form-group">
        <label htmlFor="ward">Phường/Xã</label>
        <select
          id="ward"
          value={selectedWard?.code || ''}
          onChange={handleWardChange}
          disabled={!selectedDistrict}
        >
          <option value="">-- Chọn Phường/Xã --</option>
          {wards.map(ward => (
            <option key={ward.code} value={ward.code}>
              {ward.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default LocationSelector;
