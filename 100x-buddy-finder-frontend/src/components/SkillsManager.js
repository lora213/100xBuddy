// components/SkillsManager.js
import React, { useState, useEffect } from 'react';
import { addSkills } from '../services/api';
import { toast } from 'react-toastify';

const SkillsManager = () => {
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState({
    skill_name: '',
    skill_type: '',
    proficiency_level: 3,
    years_experience: ''
  });
  const [saving, setSaving] = useState(false);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSkill(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleAddSkill = (e) => {
    e.preventDefault();
    
    // Validate
    if (!newSkill.skill_name || !newSkill.skill_type) {
      toast.error('Skill name and type are required');
      return;
    }
    
    // Add to list
    setSkills(prev => [...prev, { ...newSkill, id: Date.now() }]);
    
    // Reset form
    setNewSkill({
      skill_name: '',
      skill_type: '',
      proficiency_level: 3,
      years_experience: ''
    });
  };
  
  const handleRemoveSkill = (skillId) => {
    setSkills(prev => prev.filter(skill => skill.id !== skillId));
  };
  
  const handleSaveAllSkills = async () => {
    if (skills.length === 0) {
      toast.info('Please add at least one skill');
      return;
    }
    
    setSaving(true);
    
    try {
      // Format skills for the API
      const formattedSkills = skills.map(skill => ({
        skill_name: skill.skill_name,
        skill_type: skill.skill_type,
        proficiency_level: skill.proficiency_level,
        years_experience: skill.years_experience
      }));
      
      await addSkills(formattedSkills);
      toast.success('Skills saved successfully!');
    } catch (err) {
      console.error('Save skills error:', err);
      toast.error('Failed to save skills');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Technical Skills</h2>
      
      <div className="mb-6">
        <h3 className="font-medium mb-2">Add a Skill</h3>
        <form onSubmit={handleAddSkill} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block mb-1">Skill Name</label>
            <input
              type="text"
              name="skill_name"
              value={newSkill.skill_name}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="e.g. JavaScript, React, Python"
            />
          </div>
          
          <div>
            <label className="block mb-1">Skill Type</label>
            <select
              name="skill_type"
              value={newSkill.skill_type}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="">Select Type</option>
              <option value="language">Programming Language</option>
              <option value="framework">Framework/Library</option>
              <option value="tool">Tool/Platform</option>
              <option value="soft">Soft Skill</option>
            </select>
          </div>
          
          <div>
            <label className="block mb-1">Proficiency (1-5)</label>
            <select
              name="proficiency_level"
              value={newSkill.proficiency_level}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="1">1 - Beginner</option>
              <option value="2">2 - Elementary</option>
              <option value="3">3 - Intermediate</option>
              <option value="4">4 - Advanced</option>
              <option value="5">5 - Expert</option>
            </select>
          </div>
          
          <div>
            <label className="block mb-1">Years of Experience</label>
            <input
              type="number"
              name="years_experience"
              value={newSkill.years_experience}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="e.g. 2.5"
              step="0.5"
              min="0"
            />
          </div>
          
          <div className="md:col-span-2">
            <button
              type="submit"
              className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
            >
              Add to List
            </button>
          </div>
        </form>
      </div>
      
      {skills.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium mb-2">Your Skills</h3>
          <div className="space-y-2">
            {skills.map(skill => (
              <div key={skill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <div className="font-medium">{skill.skill_name}</div>
                  <div className="text-sm text-gray-600">
                    {skill.skill_type} • Proficiency: {skill.proficiency_level}/5
                    {skill.years_experience && ` • ${skill.years_experience} years`}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveSkill(skill.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          
          <button
            onClick={handleSaveAllSkills}
            className="mt-4 bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save All Skills'}
          </button>
        </div>
      )}
      
      {skills.length === 0 && (
        <p className="text-gray-500">Add your technical skills to help us find the best match for you.</p>
      )}
    </div>
  );
};

export default SkillsManager;