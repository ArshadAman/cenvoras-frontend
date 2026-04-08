export const parseJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

export const getUserRole = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const decoded = parseJwt(token);
    return decoded ? decoded.role : null;
};

export const hasRole = (allowedRoles) => {
    const role = getUserRole();
    if (!role) return false;
    // Admin has access to everything by default usually, but let's be explicit
    return allowedRoles.includes(role);
};
