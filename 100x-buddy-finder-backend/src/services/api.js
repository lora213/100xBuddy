export const analyzeGithub = (profileUrl) => {
  return api.post('/analysis/github', { profile_url: profileUrl });
};

export const analyzeLinkedin = (profileUrl) => {
  return api.post('/analysis/linkedin', { profile_url: profileUrl });
};

export const analyzeAllProfiles = () => {
  return api.post('/analysis/analyze-all');
};