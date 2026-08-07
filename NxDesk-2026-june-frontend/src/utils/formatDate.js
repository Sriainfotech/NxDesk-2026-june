// export const formatDate = (dateString) => {
//   if (!dateString || dateString === "-") return "-";
  
//   const date = new Date(dateString);
  
//   // Check if date is valid
//   if (isNaN(date.getTime())) return "-";
  
//   // Format as "DD Month YYYY"
//   const day = date.getDate();
//   const month = date.toLocaleString('default', { month: 'long' });
//   const year = date.getFullYear();
  
//   return `${day} ${month} ${year}`;
// };

// export const formatDate = (dateString) => {   formatDateTime
//   if (!dateString || dateString === "-") return "-";
  
//   const date = new Date(dateString);
  
//   // Check if date is valid
//   if (isNaN(date.getTime())) return "-";
  
//   // Format as "DD Month YYYY, HH:MM"
//   const day = date.getDate();
//   const month = date.toLocaleString('default', { month: 'long' });
//   const year = date.getFullYear();
  
//   // Format time (24-hour format)
//   const hours = date.getHours().toString().padStart(2, '0');
//   const minutes = date.getMinutes().toString().padStart(2, '0');
  
//   return `${day} ${month} ${year}, ${hours}:${minutes}`;
// };

// For 12-hour format with AM/PM
export const formatDate = (dateString) => { //formatDateTimeAMPM
  if (!dateString || dateString === "-") return "-";
  
  const date = new Date(dateString);
  
  // Check if date is valid
  if (isNaN(date.getTime())) return "-";
  
  // Format as "DD Month YYYY, HH:MM AM/PM"
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();
  
  // Format time (12-hour format with AM/PM)
  let hours = date.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${day} ${month} ${year}, ${hours}:${minutes} ${ampm}`;
};