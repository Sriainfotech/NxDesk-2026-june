const formatDate = (dateString) => {
    if (!dateString || dateString === "-") return "-";
    
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) return "-";
    
    // Format as "DD Month YYYY"
    const day = date.getDate();
    const month = date.toLocaleString('default', { month: 'long' });
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  };