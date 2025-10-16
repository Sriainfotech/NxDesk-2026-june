// import React from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { disableButton } from "../../store/Slices/buttonSlice";

// const Button = ({ label, onClick }) => {
//   // const dispatch = useDispatch();
//   const isDisabled = useSelector((state) => state.button.isDisabled);

//   const handleClick = () => {
//     dispatch(disableButton());

//     if (onClick) {
//       onClick();
//     }
//   };

//   return (
//     <button
//       onClick={onClick}
//       disabled={isDisabled}
//       className={`px-6 py-2 text-white rounded-md transition-colors duration-200 ${
//         isDisabled
//           ? "bg-gray-400 cursor-not-allowed"
//           : "bg-blue-500 hover:bg-blue-600"
//       }`}
//     >
//       {label}
//     </button>
//   );
// };

// export default Button;

import React from "react";

const Button = ({ label, onClick, blueBackground }) => {
  const onClickButton = () => {
    onClick();
  };

  return (
    <button
      onClick={onClick}
      className={`px-6 py-2  rounded-md transition-colors duration-200 ${
        blueBackground
          ? "text-white  bg-[#2E6EC0] hover:bg-blue-600"
          : "text-blue-500 bg-white hover:bg-grey-100"
      }`}
    >
      {label}
    </button>
  );
};

export default Button;
