import { Link, Route, Routes } from "react-router-dom";

export function App() {
	return (
		<div>
			{/* START: routes */}
			{/* These routes and navigation have been generated for you */}
			{/* Feel free to move and update them to fit your needs */}
			<nav className="m-4">
				<ul className="flex gap-4">
					<li>
						<Link to="/">Home</Link>
					</li>
					<li>
						<Link to="/page-2">Page 2</Link>
					</li>
				</ul>
			</nav>
			<Routes>
				<Route
					path="/"
					element={
						<div className="ml-4">
							This is the generated root route.{" "}
							<Link to="/page-2">Click here for page 2.</Link>
						</div>
					}
				/>
				<Route
					path="/page-2"
					element={
						<div className="ml-4">
							<Link to="/">Click here to go back to root page.</Link>
						</div>
					}
				/>
			</Routes>
			{/* END: routes */}
		</div>
	);
}

export default App;
