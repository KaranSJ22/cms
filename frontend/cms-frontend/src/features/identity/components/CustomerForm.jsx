import { useState } from 'react';
import { PrimaryBtn, GhostBtn } from '../../../components/ui/Buttons';
import { LightInput, FieldLabel, ErrMsg } from '../../../components/ui/FormComponents';

export function CustomerForm({ onSubmit, loading, onCancel }) {
  const [formData, setFormData] = useState({
    USERID: '',
    CTYPECODE: 'PRM',
    DISPNAME: '',
    STATUS: 'ACT',
    VALIDFROM: '',
    VALIDUNTIL: ''
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};

    if (formData.USERID && isNaN(parseInt(formData.USERID, 10))) {
      newErrors.USERID = 'User ID must be a valid number';
    }

    if (!formData.DISPNAME || formData.DISPNAME.length < 2 || formData.DISPNAME.length > 120) {
      newErrors.DISPNAME = 'Display Name must be between 2 and 120 characters';
    }

    // Optional date validation could be added here to ensure VALIDUNTIL > VALIDFROM

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
      // transform payload format if necessary
      const payload = { ...formData };
      if (payload.USERID) payload.USERID = parseInt(payload.USERID, 10);
      else delete payload.USERID;
      
      if (!payload.VALIDFROM) delete payload.VALIDFROM;
      else payload.VALIDFROM = new Date(payload.VALIDFROM).toISOString();
      
      if (!payload.VALIDUNTIL) delete payload.VALIDUNTIL;
      else payload.VALIDUNTIL = new Date(payload.VALIDUNTIL).toISOString();

      onSubmit(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <FieldLabel>User ID (Optional linked user)</FieldLabel>
        <LightInput 
          type="number"
          value={formData.USERID} 
          onChange={(val) => handleChange('USERID', val)} 
          placeholder="e.g. 1" 
        />
        {errors.USERID && <ErrMsg>{errors.USERID}</ErrMsg>}
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel required>Customer Type</FieldLabel>
        <select 
          value={formData.CTYPECODE}
          onChange={(e) => handleChange('CTYPECODE', e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-[0.82rem] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
        >
          <option value="PRM">Permanent</option>
          <option value="CNT">Contract</option>
          <option value="VIS">Visitor</option>
          <option value="OCE">Other Centre</option>
          <option value="OFR">Officer</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel required>Display Name</FieldLabel>
        <LightInput 
          value={formData.DISPNAME} 
          onChange={(val) => handleChange('DISPNAME', val)} 
          placeholder="Jane Doe or Organization Name" 
        />
        {errors.DISPNAME && <ErrMsg>{errors.DISPNAME}</ErrMsg>}
      </div>

      <div className="flex flex-col gap-1.5">
        <FieldLabel required>Status</FieldLabel>
        <select 
          value={formData.STATUS}
          onChange={(e) => handleChange('STATUS', e.target.value)}
          className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 text-[0.82rem] outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/10 transition-all"
        >
          <option value="A">Active (A)</option>
          <option value="D">Deleted (D)</option>
          <option value="P">Pending (P)</option>
          <option value="EXP">Expired (EXP)</option>
          <option value="BLK">Blocked (BLK)</option>
        </select>
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
        <PrimaryBtn type="submit" loading={loading} className="flex-1">Create Customer</PrimaryBtn>
      </div>
    </form>
  );
}
