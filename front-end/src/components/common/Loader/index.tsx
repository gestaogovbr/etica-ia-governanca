const Loader = () => {
	return (
		<div className="flex h-screen items-center justify-center bg-white dark:bg-black">
			<div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-dark border-t-transparent"></div>
		</div>
	);
};

export default Loader;

// const Loader = () => {
//   return (
//     <div className="flex h-screen items-center justify-center bg-white dark:bg-black">
//       <div style={{border: localStorage.getItem("cor_padrao") ?? "#222"}} className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-t-transparent"></div>
//     </div>
//   );
// };

// export default Loader;
