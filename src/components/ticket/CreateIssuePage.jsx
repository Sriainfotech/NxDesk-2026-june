import React from 'react';
import { useSelector } from 'react-redux';
import SelectField from '../common/SelectField';
import { setIssueStatus, setIssueParent } from '../../store/Slices/formSlice'; // Correct the import path as needed

const CreateIssueForm = () => {
  const issueStatus = useSelector((state) => state.form.issueStatus);
  const issueParent = useSelector((state) => state.form.issueParent);

  const handleSubmit = (event) => {
    event.preventDefault();
    console.log({ issueStatus, issueParent });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
      <SelectField
        label="Status"
        optionsKey="statusOptions"
        valueKey="issueStatus"
        onChangeAction={setIssueStatus}
        required
      />
      <SelectField
        label="Parent"
        optionsKey="parentOptions"
        valueKey="issueParent"
        onChangeAction={setIssueParent}
      />
      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Create
      </button>
    </form>
  );
};
export default CreateIssueForm;