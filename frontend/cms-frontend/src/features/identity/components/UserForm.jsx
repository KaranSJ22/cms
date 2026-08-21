import { useState } from 'react';
import { PrimaryBtn, GhostBtn } from '../../../components/ui/Buttons';
import { LightInput, FieldLabel, ErrMsg } from '../../../components/ui/FormComponents';

export function UserForm({ onSubmit, loading, onCancel }) {
  const [formData, setFormData] = useState({
    LOGINID: '',
    FULLNAME: '',
    EMAIL: '',
    MOBILENO: '',
    PASSWORD: '',
    AUTHPROV: 'LOCAL',
    AUTHID: ''
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!formData.LOGINID || formData.LOGINID.length < 3 || formData.LOGINID.length > 50) {
      newErrors.LOGINID = 'LOGINID must be between 3 and 50 characters';
    } else if (!/^[A-Za-z0-9@._-]+$/.test(formData.LOGINID)) {
      newErrors.LOGINID = 'LOGINID contains invalid characters';
    }

    if (!formData.FULLNAME || formData.FULLNAME.length < 2 || formData.FULLNAME.length > 120) {
      newErrors.FULLNAME = 'FULLNAME must be between 2 and 120 characters';
    }

    if (formData.EMAIL && !/^\S+@\S+\.\S+$/.test(formData.EMAIL)) {
      newErrors.EMAIL = 'Invalid email address';
    }

    if (formData.MOBILENO && !/^[6-9][0-9]{9}$/.test(formData.MOBILENO)) {
      newErrors.MOBILENO = 'Invalid Indian mobile number';
    }

    if (!formData.PASSWORD || formData.PASSWORD.length < 8 || formData.PASSWORD.length > 72) {
      newErrors.PASSWORD = 'PASSWORD must be between 8 and 72 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <FieldLabel required>Login ID</FieldLabel>
        <LightInput 
          value={formData.LOGINID} 
          onChange={(val) => handleChange('LOGINID', val)} 
          placeholder="user@example.com or username" 
        />
        {errors.LOGINID && <ErrMsg>{errors.LOGINID}</ErrMsg>}
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel required>Full Name</FieldLabel>
        <LightInput 
          value={formData.FULLNAME} 
          onChange={(val) => handleChange('FULLNAME', val)} 
          placeholder="John Doe" 
        />
        {errors.FULLNAME && <ErrMsg>{errors.FULLNAME}</ErrMsg>}
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Email (Optional)</FieldLabel>
        <LightInput 
          type="email"
          value={formData.EMAIL} 
          onChange={(val) => handleChange('EMAIL', val)} 
          placeholder="john.doe@example.com" 
        />
        {errors.EMAIL && <ErrMsg>{errors.EMAIL}</ErrMsg>}
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Mobile Number (Optional)</FieldLabel>
        <LightInput 
          value={formData.MOBILENO} 
          onChange={(val) => handleChange('MOBILENO', val)} 
          placeholder="9876543210" 
        />
        {errors.MOBILENO && <ErrMsg>{errors.MOBILENO}</ErrMsg>}
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel required>Password</FieldLabel>
        <LightInput 
          type="password"
          value={formData.PASSWORD} 
          onChange={(val) => handleChange('PASSWORD', val)} 
          placeholder="Min 8 characters" 
        />
        {errors.PASSWORD && <ErrMsg>{errors.PASSWORD}</ErrMsg>}
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel required>Auth Provider</FieldLabel>
        <select 
          value={formData.AUTHPROV}
          onChange={(e) => handleChange('AUTHPROV', e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-[0.82rem] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
        >
          <option value="LOCAL">Local</option>
          <option value="SSO">SSO</option>
        </select>
      </div>

      {formData.AUTHPROV === 'SSO' && (
        <div className="flex flex-col gap-1.5">
          <FieldLabel>Auth ID</FieldLabel>
          <LightInput 
            value={formData.AUTHID} 
            onChange={(val) => handleChange('AUTHID', val)} 
            placeholder="SSO Identifier" 
          />
        </div>
      )}

      <div className="flex items-center gap-3 mt-4">
        <GhostBtn onClick={onCancel} className="flex-1">Cancel</GhostBtn>
        <PrimaryBtn type="submit" loading={loading} className="flex-1">Create User</PrimaryBtn>
      </div>
    </form>
  );
}
