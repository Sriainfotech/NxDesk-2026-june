const Card = ({ title, description, icon, className = "", onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`relative w-80 h-48 bg-white rounded-2xl shadow-lg p-6 pt-10 text-center transition-all duration-300 hover:shadow-2xl cursor-pointer ${className}`}
    >
      {/* Floating Icon */}
      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-14 h-14 bg-[#224d86] rounded-full flex items-center justify-center shadow-md">
        {icon}
      </div>

      <h3 className="text-lg font-bold text-[#093d80] mb-2">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed max-w-[220px] mx-auto">
        {description}
      </p>
    </div>
  );
};

export default Card;
