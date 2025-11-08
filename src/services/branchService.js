import API_URL from '../config/api';

class BranchService {
  async getBranches() {
    const response = await fetch(`${API_URL}/api/branches`);

    if (!response.ok) {
      throw new Error('Failed to load branches');
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  }
}

const branchService = new BranchService();
export default branchService;

