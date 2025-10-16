
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { axiosInstance } from "../utils/axiosInstance"; // Adjust path to match your file structure
import { fetchItemData } from "../store/Slices/itemsSlice";

const SideBarItems = () => {
  const dispatch = useDispatch();

  const SideItem = ({ title, apiUrl }) => {
    const { itemsData, loading, error } = useSelector((state) => state.items);
    const itemData = itemsData[apiUrl] || [];

    // Fetch data when the component mounts
    useEffect(() => {
      const fetchData = async () => {
        try {
          const authToken = localStorage.getItem("access_token");
          if (!authToken) {
            toast.error("Access token missing. Please log in.");
            dispatch(fetchItemData.rejected("No access token", null, apiUrl));
            return;
          }

          const authHeaders = { headers: { Authorization: `Bearer ${authToken}` } };
          const response = await axiosInstance.get(apiUrl, authHeaders);

          // Dispatch fetched data to Redux store
          dispatch(fetchItemData.fulfilled(response.data, null, apiUrl));
        } catch (error) {
          console.error(`Error fetching ${title} from ${apiUrl}:`, error);
          toast.error(`Failed to load ${title}.`);
          dispatch(fetchItemData.rejected(error.message, null, apiUrl));
        }
      };

      if (apiUrl) {
        fetchData();
      }
    }, [dispatch, apiUrl, title]);

    return (
      <div className="bg-white w-80 rounded-lg shadow-md overflow-hidden transition-shadow duration-300 hover:shadow-lg mb-6">
        <div className="bg-gradient-to-r from-blue-800 to-blue-600 py-3 px-4">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-pulse h-4 w-3/4 bg-gray-200 rounded"></div>
            </div>
          ) : error ? (
            <p className="text-red-500 text-sm py-2 px-3 bg-red-50 rounded border border-red-100">{error}</p>
          ) : itemData.length > 0 ? (
            <ul className="space-y-2">
              {itemData.map((item, index) => (
                <li
                  key={item.id || index} // Use item.id if available
                  className="text-gray-700 border-b border-gray-100 pb-2 last:border-0 last:pb-0"
                >
                  {item.message || item.title || JSON.stringify(item)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center py-4 italic text-sm">No records found</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#306EBF] w-[360px] min-h-full p-4 text-white rounded-r-lg">
      <div className="my-8 pl-3">
        {/* <SideItem title="My Recent Items" apiUrl="five_notifications/recent-items/" /> */}
        {/* <SideItem title="Popular Items" apiUrl="five_notifications/popular-items/" /> */}
        <SideItem title="Announcements" apiUrl="five_notifications/announcements/" />
        <SideItem title="My Open Items" apiUrl="five_notifications/open-items/" />
        <SideItem title="Appreciations" apiUrl="five_notifications/appreciations/" />
      </div>
    </div>
  );
};

export default SideBarItems;
