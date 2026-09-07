import { useState } from 'react';
import { PrimaryBtn, GhostBtn } from '../../../components/ui/Buttons';
import { LightInput, FieldLabel, ErrMsg } from '../../../components/ui/FormComponents';

export function RoleForm({ onSubmit, loading, onCancel }) {
  const [formData, setFormData] = useState({
    USERID: '',
    ROLEID: '',
    VALIDFROM: '',
    VALIDUNTIL: ''
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (!formData.USERID || isNaN(parseInt(formData.USERID, 10)) || parseInt(formData.USERID, 10) <= 0) {
      newErrors.USERID = 'Valid User ID is required';
    }

    if (!formData.ROLEID || isNaN(parseInt(formData.ROLEID, 10)) || parseInt(formData.ROLEID, 10) <= 0) {
      newErrors.ROLEID = 'Valid Role ID is required';
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
      const payload = {
        USERID: parseInt(formData.USERID, 10),
        ROLEID: parseInt(formData.ROLEID, 10),
      };
      
      if (formData.VALIDFROM) payload.VALIDFROM = new Date(formData.VALIDFROM).toISOString();
      if (formData.VALIDUNTIL) payload.VALIDUNTIL = new Date(formData.VALIDUNTIL).toISOString();

      onSubmit(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <FieldLabel required>User ID</FieldLabel>
        <LightInput 
          type="number"
          value={formData.USERID} 
          onChange={(val) => handleChange('USERID', val)} 
          placeholder="Enter numeric User ID" 
        />
        {errors.USERID && <ErrMsg>{errors.USERID}</ErrMsg>}
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel required>Role ID</FieldLabel>
        <LightInput 
          type="number"
          value={formData.ROLEID} 
          onChange={(val) => handleChange('ROLEID', val)} 
          placeholder="Enter numeric Role ID" 
        />
        {errors.ROLEID && <ErrMsg>{errors.ROLEID}</ErrMsg>}
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Valid From (Optional)</FieldLabel>
        <LightInput 
          type="datetime-local"
          value={formData.VALIDFROM} 
          onChange={(val) => handleChange('VALIDFROM', val)} 
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel>Valid Until (Optional)</FieldLabel>
        <LightInput 
          type="datetime-local"
          value={formData.VALIDUNTIL} 
          onChange={(val) => handleChange('VALIDUNTIL', val)} 
        />
      </div>

      <div className="flex items-center gap-3 mt-4">
        <GhostBtn onClick={onCancel} className="flex-1">Cancel</GhostBtn>
        <PrimaryBtn type="submit" loading={loading} className="flex-1">Assign Role</PrimaryBtn>
      </div>
    </form>
  );
}
