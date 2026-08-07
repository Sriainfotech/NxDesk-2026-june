import { jwtDecode } from 'jwt-decode'; // Correct import for the newer version

// Function to decode JWT
const decodeJwtToken = (token) => {
  try {
    // Decode the JWT token and return the decoded payload
    const decoded = jwtDecode(token);
    return decoded;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null; // Return null in case of an error
  }
};

export default decodeJwtToken;
