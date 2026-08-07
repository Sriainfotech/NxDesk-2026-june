import { useState, useEffect } from "react";
import ChatbotPopup from "../../components/ChatBot";
import { fetchUserDetails } from "../../store/actions/userActions";
import {
  User,
  Mail,
  MapPin,
  Calendar,
  FileText,
  Phone,
  Save,
  X,
  Upload,
  Edit2,
  Briefcase,
  Users,
  ShieldCheck,
  AtSign,
  Folder,
  ChevronDown,
} from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import Select from "react-select";
import { Country, State, City } from "country-state-city";
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import { axiosInstance } from "../../utils/axiosInstance";
import PhoneNumberInput from "../../components/common/PhoneNumberInput"; // Import the new PhoneNumberInput component

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [isPhoneValid, setIsPhoneValid] = useState(true);
  const dispatch = useDispatch();

  const userProfile = useSelector((state) => state.userProfile.user);
  const authToken = localStorage.getItem("access_token");

  // Initialize location data
  useEffect(() => {
    const allCountries = Country.getAllCountries().map((country) => ({
      value: country.isoCode,
      label: country.name,
    }));
    setCountries(allCountries);
  }, []);

  // Load states based on selected country
  useEffect(() => {
    if (editedProfile?.country) {
      const countryStates = State.getStatesOfCountry(editedProfile.country).map(
        (state) => ({
          value: state.isoCode,
          label: state.name,
        })
      );
      setStates(countryStates);
    } else {
      setStates([]);
    }
  }, [editedProfile?.country]);

  // Load cities based on selected state and country
  useEffect(() => {
    if (editedProfile?.country && editedProfile?.state) {
      const stateCities = City.getCitiesOfState(
        editedProfile.country,
        editedProfile.state
      ).map((city) => ({
        value: city.name,
        label: city.name,
      }));
      setCities(stateCities);
    } else {
      setCities([]);
    }
  }, [editedProfile?.country, editedProfile?.state]);

  // Initialize editedProfile when userProfile loads
  useEffect(() => {
    if (userProfile) {
      setEditedProfile({ ...userProfile });
      setImagePreview(userProfile.profile_pic);
    }
  }, [userProfile]);

  if (!userProfile) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading profile data...
      </div>
    );
  }

  const handleEditToggle = () => {
    if (!isEditing) {
      setEditedProfile({ ...userProfile });
      setImagePreview(userProfile.profile_pic);
      setProfileImage(null);
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProfile((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Phone number input handler for the new component
  const handlePhoneChange = (phoneNumber) => {
    setEditedProfile((prev) => ({
      ...prev,
      phone_number: phoneNumber,
    }));
  };

  const handlePhoneValidChange = (validPhoneNumber) => {
    setIsPhoneValid(true);
  };

  // Handle country, state, city selection
  const handleCountryChange = (selectedOption) => {
    setEditedProfile((prev) => ({
      ...prev,
      country: selectedOption ? selectedOption.value : "",
      state: "",
      city: "",
    }));
  };

  const handleStateChange = (selectedOption) => {
    setEditedProfile((prev) => ({
      ...prev,
      state: selectedOption ? selectedOption.value : "",
      city: "",
    }));
  };

  const handleCityChange = (selectedOption) => {
    setEditedProfile((prev) => ({
      ...prev,
      city: selectedOption ? selectedOption.value : "",
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    // Validate phone number before saving
    if (!isPhoneValid && editedProfile.phone_number) {
      toast.error("Please enter a valid phone number");
      return;
    }

    try {
      setIsLoading(true);

      const formData = new FormData();

      // Add all profile fields to formData
      Object.keys(editedProfile).forEach((key) => {
        // Skip fields that should not be edited
        const nonEditableFields = [
          "email",
          "organisation_name",
          "assigned_projects",
          "role",
          "username",
          "profile_pic",
          "created_at",
          "modified_at",
        ];

        if (!nonEditableFields.includes(key)) {
          // Include all fields, even if they're empty strings
          // This ensures that empty values will clear existing data
          formData.append(
            key,
            editedProfile[key] === null ? "" : editedProfile[key]
          );
        }
      });

      // Add profile image if changed
      if (profileImage) {
        formData.append("profile_pic", profileImage);
      }

      const config = {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "multipart/form-data",
        },
      };
      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }
      const response = await axiosInstance.put(
        `details/personal_details/`,
        formData,
        config
      );

      if (response.status === 200) {
        dispatch(fetchUserDetails(authToken));
        toast.success("Profile updated successfully");
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update profile";
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    try {
      const date = new Date(dateString);
      // Only show date without time for date of birth
      if (dateString === userProfile.date_of_birth) {
        const options = {
          day: "numeric",
          month: "long",
          year: "numeric",
        };
        return date.toLocaleDateString("en-US", options);
      }
      // Show date and time for other dates
      const options = {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      };
      return date.toLocaleDateString("en-US", options);
    } catch (error) {
      return dateString;
    }
  };

  const isProfileIncomplete = () => {
    const requiredFields = [
      userProfile.first_name,
      userProfile.last_name,
      userProfile.phone_number,
    ];

    return requiredFields.some((field) => {
      if (field === null || field === undefined) return true;
      return String(field).trim() === "";
    });
  };

  // Format phone number display for viewing mode
  const formatPhoneNumberForDisplay = (phone) => {
    if (!phone) return "Not specified";
    return phone; // The PhoneNumberInput component already formats the phone number
  };

  // Select styles for consistent UI
  const selectStyles = {
    control: (provided) => ({
      ...provided,
      fontSize: "0.875rem",
      borderColor: "#93c5fd",
      minHeight: "31px",
      height: "31px",
    }),
    valueContainer: (provided) => ({
      ...provided,
      padding: "0 8px",
    }),
    input: (provided) => ({
      ...provided,
      margin: "0px",
    }),
    indicatorsContainer: (provided) => ({
      ...provided,
      height: "31px",
    }),
    option: (provided) => ({
      ...provided,
      fontSize: "0.875rem",
    }),
    noOptionsMessage: (provided) => ({
      ...provided,
      fontSize: "0.875rem",
    }),
  };

  return (
    <div className="flex flex-col h-auto">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 p-4 overflow-auto">
          <div className="bg-white rounded-lg shadow h-full flex flex-col">
            {/* Profile Header - Now showing username instead of first/last name */}
            <div className="bg-[#093D80] p-4 text-white">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white">
                    <img
                      src={
                        isEditing
                          ? imagePreview
                          : userProfile.profile_pic ||
                            "/api/placeholder/150/150"
                      }
                      alt="Profile"
                      className="object-cover w-full h-full"
                    />
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-0 right-0 bg-white p-1 rounded-full shadow-md text-blue-600 cursor-pointer hover:bg-blue-50">
                      <Upload size={12} />
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <h2 className="text-xl font-bold">
                      {userProfile.username}
                    </h2>
                    {isProfileIncomplete() && !isEditing && (
                      <span className="ml-3 text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full">
                        Profile Incomplete
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {isEditing ? (
                      <>
                        <button
                          onClick={handleSave}
                          disabled={isLoading}
                          className={`bg-white text-blue-600 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                            isLoading
                              ? "opacity-70 cursor-not-allowed"
                              : "hover:bg-blue-50"
                          }`}
                        >
                          <Save size={12} /> {isLoading ? "Saving..." : "Save"}
                        </button>
                        <button
                          onClick={handleEditToggle}
                          disabled={isLoading}
                          className="bg-transparent border border-white text-white px-3 py-1 rounded-full text-xs font-medium hover:bg-white/10 flex items-center gap-1"
                        >
                          <X size={12} /> Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={handleEditToggle}
                        className="bg-white text-blue-600 px-3 py-1 rounded-full text-xs font-medium hover:bg-blue-50 flex items-center gap-1"
                      >
                        <Edit2 size={12} />{" "}
                        {isProfileIncomplete()
                          ? "Complete Profile"
                          : "Edit Profile"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Content - Improved Organization */}
            <div className="flex-1 p-4 overflow-auto">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-semibold mb-3 text-gray-800 flex items-center">
                  Profile Information
                  {isEditing && (
                    <span className="ml-2 text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">
                      Editing
                    </span>
                  )}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Basic Information Column - Now includes first/last name */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Basic Information
                    </h4>

                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 rounded text-blue-600">
                        <User size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Full Name</p>
                        {isEditing ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              name="first_name"
                              value={editedProfile.first_name || ""}
                              onChange={handleInputChange}
                              className="w-full text-sm bg-white border border-blue-300 rounded px-2 py-1"
                              placeholder="First Name"
                            />
                            <input
                              type="text"
                              name="last_name"
                              value={editedProfile.last_name || ""}
                              onChange={handleInputChange}
                              className="w-full text-sm bg-white border border-blue-300 rounded px-2 py-1"
                              placeholder="Last Name"
                            />
                          </div>
                        ) : (
                          <p className="text-sm font-medium">
                            {userProfile.first_name || userProfile.last_name
                              ? `${userProfile.first_name || ""} ${
                                  userProfile.last_name || ""
                                }`
                              : "Not specified"}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100 rounded text-blue-600">
                        <AtSign size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Employee ID</p>
                        <p className="text-sm font-medium">
                          {`EMP ${userProfile.employee_id}` || "Not assigned yet"}
                        </p>
                      </div>
                    </div> */}

                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-purple-100 rounded text-purple-600">
                        <Mail size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Email Address</p>
                        <p className="text-sm font-medium break-all">
                          {userProfile.email}
                        </p>
                        {isEditing && (
                          <p className="text-xs italic text-gray-400 mt-1">
                            Email cannot be edited
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-green-100 rounded text-green-600">
                        <Phone size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Phone Number</p>
                        {isEditing ? (
                          <PhoneNumberInput
                            value={editedProfile.phone_number || ""}
                            onChange={handlePhoneChange}
                            onValidChange={handlePhoneValidChange}
                            placeholder="Enter phone number"
                            required={false}
                            className="h-[31px] "
                            errorMessage="Please enter a valid phone number"
                          />
                        ) : (
                          <p className="text-sm font-medium">
                            {formatPhoneNumberForDisplay(
                              userProfile.phone_number
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-red-100 rounded text-red-600">
                        <Calendar size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Date of Birth</p>
                        {isEditing ? (
                          <input
                            type="date"
                            name="date_of_birth"
                            value={editedProfile.date_of_birth || ""}
                            onChange={handleInputChange}
                            className="w-full text-sm bg-white border border-blue-300 rounded px-2 py-1"
                            placeholder="Date of Birth"
                            max={new Date().toISOString().split("T")[0]}
                          />
                        ) : (
                          <p className="text-sm font-medium">
                            {formatDate(userProfile.date_of_birth) ||
                              "Not specified"}
                          </p>
                        )}
                      </div>
                    </div> */}
                  </div>

                  {/* Work Information Column */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                      Work Information
                    </h4>

                    {/* <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-100 rounded text-indigo-600">
                        <FileText size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Department</p>
                        {isEditing ? (
                          <input
                            type="text"
                            name="department"
                            value={editedProfile.department || ""}
                            onChange={handleInputChange}
                            className="w-full text-sm bg-white border border-blue-300 rounded px-2 py-1"
                            placeholder="Department"
                          />
                        ) : (
                          <p className="text-sm font-medium">
                            {userProfile.department || "Not specified"}
                          </p>
                        )}
                      </div>
                    </div> */}

                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-orange-100 rounded text-orange-600">
                        <ShieldCheck size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Role</p>
                        <p className="text-sm font-medium">
                          {userProfile.role || "Not specified"}
                        </p>
                        {isEditing && (
                          <p className="text-xs italic text-gray-400 mt-1">
                            Role cannot be edited
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-pink-100 rounded text-pink-600">
                        <Briefcase size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Organisation</p>
                        <p className="text-sm font-medium">
                          {userProfile.organisation_name || "Not specified"}
                        </p>
                        {isEditing && (
                          <p className="text-xs italic text-gray-400 mt-1">
                            Organisation cannot be edited
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assigned Projects Section */}
                {/* <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Assigned Projects
                    </h4>
                    <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full text-xs font-medium">
                      {userProfile.assigned_projects?.length || 0} Projects
                    </span>
                  </div>

                  {userProfile.assigned_projects &&
                  userProfile.assigned_projects.length > 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                      <div className="grid grid-cols-12 px-4 py-2 bg-gray-50 text-xs font-medium text-gray-500 rounded-t-lg">
                        <div className="col-span-5">Project Name</div>
                      </div>

                      {userProfile.assigned_projects.map((project, index) => (
                        <div
                          key={index}
                          className={`grid grid-cols-12 px-4 py-3 text-sm items-center ${
                            index !== userProfile.assigned_projects.length - 1
                              ? "border-b border-gray-200"
                              : ""
                          }`}
                        >
                          <div className="col-span-5 flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 rounded text-blue-600">
                              <Folder size={14} />
                            </div>
                            <span className="font-medium">
                              {project.project_name}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border border-gray-200 p-4 text-center text-gray-500">
                      No projects are currently assigned to you.
                    </div>
                  )}

                  {isEditing && (
                    <p className="text-xs italic text-gray-400 mt-1">
                      Projects cannot be edited from this section
                    </p>
                  )}
                </div> */}

                {/* Address Information Section */}
                {/* <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
                    Address Information
                  </h4>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-yellow-100 rounded text-yellow-600">
                      <MapPin size={14} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">Address</p>
                      {isEditing ? (
                        <input
                          type="text"
                          name="address"
                          value={editedProfile.address || ""}
                          onChange={handleInputChange}
                          className="w-full text-sm bg-white border border-blue-300 rounded px-2 py-1"
                          placeholder="Address"
                        />
                      ) : (
                        <p className="text-sm font-medium">
                          {userProfile.address || "Not specified"}
                        </p>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Country Dropdown */}
                {/* <div>
                        <p className="text-xs text-gray-500 mb-1">Country</p>
                        <Select
                          options={countries}
                          value={
                            editedProfile.country
                              ? countries.find(
                                  (c) => c.value === editedProfile.country
                                )
                              : null
                          }
                          onChange={handleCountryChange}
                          placeholder="Select Country"
                          isClearable
                          styles={selectStyles}
                          className="text-sm"
                        />
                      </div> */}

                {/* State Dropdown */}
                {/* <div>
                        <p className="text-xs text-gray-500 mb-1">State</p>
                        <Select
                          options={states}
                          value={
                            editedProfile.state
                              ? states.find(
                                  (s) => s.value === editedProfile.state
                                )
                              : null
                          }
                          onChange={handleStateChange}
                          placeholder="Select State"
                          isDisabled={!editedProfile.country}
                          isClearable
                          styles={selectStyles}
                          className="text-sm"
                        />
                      </div> */}

                {/* City Dropdown */}
                {/* <div>
                        <p className="text-xs text-gray-500 mb-1">City</p>
                        <Select
                          options={cities}
                          value={
                            editedProfile.city
                              ? cities.find(
                                  (c) => c.value === editedProfile.city
                                )
                              : null
                          }
                          onChange={handleCityChange}
                          placeholder="Select City"
                          isDisabled={!editedProfile.state}
                          isClearable
                          styles={selectStyles}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <p className="text-xs text-gray-500">Country</p>
                        <p className="text-sm font-medium">
                          {userProfile.country
                            ? Country.getCountryByCode(userProfile.country)
                                ?.name
                            : "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">State</p>
                        <p className="text-sm font-medium">
                          {userProfile.state && userProfile.country
                            ? State.getStateByCodeAndCountry(
                                userProfile.state,
                                userProfile.country
                              )?.name
                            : "Not specified"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">City</p>
                        <p className="text-sm font-medium">
                          {userProfile.city || "Not specified"}
                        </p>
                      </div>
                    </div>
                  )}
                </div> */}

                {/* Account Information Section */}
                {/* <div className="mt-6 pt-4 border-t border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">
                    Account Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-cyan-100 rounded text-cyan-600">
                        <Calendar size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Account Created</p>
                        <p className="text-sm font-medium">
                          {formatDate(userProfile.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-100 rounded text-emerald-600">
                        <Calendar size={14} />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-gray-500">Last Modified</p>
                        <p className="text-sm font-medium">
                          {formatDate(userProfile.modified_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div> */}
              </div>
            </div>
          </div>
        </main>
      </div>
      <ChatbotPopup />
    </div>
  );
}
