import React from 'react';

const Modal = ({ message, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-4 rounded shadow-md">
        <p>{message}</p>
        <div className="mt-4 flex justify-end">
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={onConfirm}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
// import React from 'react';
// import Button from './Button'; // Import the reusable Button component

// const OTPModal = ({ message, onClose, onConfirm }) => {
//   return (
//     <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
//       <div className="relative bg-white p-4 rounded shadow-md w-11/12 sm:w-1/2 h-auto sm:h-1/2 max-w-md">
        
//         {/* Close Icon (Top Right) using the Button component */}
//         <Button 
//           label="&times;" // Using the HTML entity for "X"
//           onClick={onClose} 
//           className="absolute top-2 right-2 text-gray-600 hover:text-gray-800 p-0 bg-transparent"
//         />
        
//         <p className="text-center">{message}</p>
        
//         <div className="mt-4 flex justify-end">
//           {/* Use the reusable Button component */}
//           <Button 
//             label="OK" 
//             onClick={onConfirm} 
//           />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default OTPModal;

