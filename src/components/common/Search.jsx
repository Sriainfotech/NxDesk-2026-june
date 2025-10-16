
import React, { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSearchQuery } from '../../store/Slices/searchSlice';
import { debounce } from '../../utils/debounce';
import SearchIcon from '@mui/icons-material/Search';

const Search = () => {
  const dispatch = useDispatch();
  const query = useSelector((state) => state.search.query);

  const debouncedDispatch = useMemo(
    () => debounce((value) => dispatch(setSearchQuery(value)), 300),
    [dispatch]
  );

  const handleChange = useCallback(
    (e) => {
      debouncedDispatch(e.target.value);
    },
    [debouncedDispatch]
  );

  return (
    <div className="relative">
      <input
        type="text"
        defaultValue={query}
        onChange={handleChange}
        className="w-1/2 pl-10 pr-4 py-2 text-gray-700 bg-white border border-gray-500 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent"
        placeholder="Search"
      />
      <SearchIcon className="absolute top-2 left-2 text-gray-800" />
    </div>
  );
};

export default Search;
