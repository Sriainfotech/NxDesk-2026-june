import SearchIcon from "@mui/icons-material/Search";

const SearchRightIcon = (props) => {
  const { placeholder } = props;

  console.log("Nothing");
  return (
    <div className="relative">
      <input
        type="text"
        className="pl-3 pr-4 py-3 rounded-xl border  w-[300px]  focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={placeholder}
      />
      <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
    </div>
  );
};

export default SearchRightIcon;
