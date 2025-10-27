const DeleteAlert = ({content, onDelete}) => {
  return (
    <div className="bg-white">
      <p className="text-sm">{content}</p>
      <div className="flex justify-end mt-6">
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 text-xs md:text-sm font-medium bg-rose-50 whitespace-nowrap text-rose-500 border-rose-100 rounded-lg px-4 py-2 curser-pointer"
          onClick={onDelete}
        >
          Delete
        </button>
      </div>
    </div>
  );
};

export default DeleteAlert;
