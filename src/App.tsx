import { useEffect, useState } from "react";
import axios from "axios";
import CSVReader from "react-csv-reader";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "./components/ui/table";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./components/ui/alert-dialog";
import { useToast } from "./components/ui/use-toast"
import { Toaster } from "./components/ui/toaster";
 

interface UserData {
	First_Name: string;
	Last_Name: string;
	Email: string;
	License_Key: string;
}

const LicenseRegistration = () => {
	const [data, setData] = useState<UserData[]>([]);
	const [First_Name, setFirst_Name] = useState("");
	const [Last_Name, setLast_Name] = useState("");
	const [Email, setEmail] = useState("");
	const [CSVData, setCSVData] = useState<UserData[]>([]);

	const [Loading, setLoading] = useState(false);
	const [isUploaderOpen, setisUploaderOpen] = useState(false);
	const [isCSVDisplayed, setCSVDisplayed] = useState(false);
	const [DeleteProgress, setDeleteProgress] = useState(false);
	const [isFetching, setFetching] = useState(false);

	const { toast } = useToast()

	const handleFile = (data: any, fileInfo: any) => {
		console.log("Data:", data);
		console.log("File Info:", fileInfo);

		// Convert CSV data to JSON
		const jsonData = convertCsvToJson(data);
		console.log("JSON Data:", jsonData);
		setisUploaderOpen(false);
		setCSVData(jsonData);
		setCSVDisplayed(true);
	};

	const convertCsvToJson = (csvData: any[]) => {
		const [header, ...rows] = csvData;
		const jsonData = rows.map((row) => {
			const entry = row.reduce((obj: any, value: any, index: any) => {
				obj[header[index]] = value;
				return obj;
			}, {});

			// Check if email is present
			if (entry.Email) {
				// If either First_Name or Last_Name is missing, fill with "null"
				entry.First_Name = entry.First_Name || "null";
				entry.Last_Name = entry.Last_Name || "null";
				return entry;
			} else {
				// If email is missing, discard the entry
				return null;
			}
		});

		// Remove entries where email is missing
		const filteredData = jsonData.filter((entry) => entry !== null);

		return filteredData;
	};

	function fetchData() {
		setDeleteProgress(true)
		setFetching(true)
		axios
			.get("http://localhost:5056/fetch")
			.then((response) => {
				// Update the state with the fetched data
				console.log(response.data);
				setData(response.data);
				setDeleteProgress(false)
				setFetching(false)
			})
			.catch((error) => {
				console.error("Error fetching data:", error);
				setDeleteProgress(false)
				toast({
					variant: "destructive",
					title: "Server Error",
					description: "Something went wrong, please try again later.",
				})
				setFetching(false)
			});
	}

	useEffect(() => {
		fetchData();
	}, []);

	function Users(props: {
		First_Name: string;
		Last_Name: string;
		Email: string;
		License_Key: string;
	}) {

		function DeleteUser() {
			setDeleteProgress(true)
			const payload = {
				License_Key: props.License_Key,
			};
			axios
				.post("http://localhost:5056/delete_user", payload)
				.then(() => {
					// Update the state with the fetched data
					setData((prev) =>
						prev.filter(
							(item) => item.License_Key !== props.License_Key
						)
					);
					setDeleteProgress(false)
					toast({
						title: "User Deleted",
						description: "User has been deleted successfully from the server.",
					})
				})
				.catch((error) => {
					setLoading(false);
					console.error("Error fetching data:", error);
					setDeleteProgress(false)
					toast({
						variant: "destructive",
						title: "Server Error",
						description: "Something went wrong, please try again later.",
					})
				});
		}

		function SendEmail() {
			setDeleteProgress(true)
			const payload = {
				Email: props.Email,
				License_Key: props.License_Key,
			};
			axios
				.post("http://localhost:5056/send_email", payload)
				.then(() => {
					// Update the state with the fetched data
					setDeleteProgress(false)
					toast({
						title: "Email Sent",
						description: "Email has been sent successfully to the user.",
					})
				})
				.catch((error) => {
					console.error("Error fetching data:", error);
					setDeleteProgress(false)
					toast({
						variant: "destructive",
						title: "Server Error",
						description: "Something went wrong, please try again later.",
					})
				});
		}



        

		return (
			<TableRow className={`${DeleteProgress && "opacity-25 pointer-events-none"}`}>
				<TableCell>{props.First_Name}</TableCell>
				<TableCell>{props.Last_Name}</TableCell>
				<TableCell>{props.Email}</TableCell>
				<TableCell>{props.License_Key}</TableCell>
				<TableCell>
					<div className="flex space-x-2">
						<Button onClick={SendEmail} className="bg-blue-500 h-10 flex items-center justify-center p-2 px-3.5 text-white rounded-md">
							<i className="fas fa-paper-plane"></i>
						</Button>
						<AlertDialog>
							<AlertDialogTrigger>
								<Button className="bg-red-500 h-10 flex items-center justify-center p-2 px-3.5 text-white rounded-md">
									<i className="fas fa-trash"></i>
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent>
								<AlertDialogHeader>
									<AlertDialogTitle>
										Are you absolutely sure?
									</AlertDialogTitle>
									<AlertDialogDescription>
										This action cannot be undone. This will
										permanently delete the user and remove
										the data from the servers.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<AlertDialogAction  className="bg-red-500" onClick={DeleteUser}>Continue</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
					
				</TableCell>
			</TableRow>
		);
	}

	function CSVDisplay(props: {
		First_Name: string;
		Last_Name: string;
		Email: string;
	}) {
		return (
			<TableRow>
				<TableCell>{props.First_Name}</TableCell>
				<TableCell>{props.Last_Name}</TableCell>
				<TableCell>{props.Email}</TableCell>
			</TableRow>
		);
	}

	function ValidateEmail(email: string): boolean {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	}

	function AddUser() {
		setLoading(true);
		setDeleteProgress(true)

		if (!ValidateEmail(Email)) {
			setLoading(false);
			setDeleteProgress(false)
			toast({
				variant: "destructive",
				title: "Invalid Email",
				description: "Please enter a valid email.",
			})
			return;
		}

		if (First_Name === "" || Last_Name === "") {
			setFirst_Name("null");
			setLast_Name("null");
		}

		const payload = {
			Data: [
				{
					First_Name: First_Name,
					Last_Name: Last_Name,
					Email: Email,
				},
			],
		};
		axios
			.post("http://localhost:5056/add_user", payload)
			.then((response) => {
				// Update the state with the fetched data
				console.log(response.data);
				setData((prev) => [...prev, response.data]);
				setLoading(false);
				setFirst_Name("");
				setLast_Name("");
				setEmail("");
				setDeleteProgress(false)
				toast({
					title: "User Added",
					description: "User has been added successfully to the server.",
				})
			})
			.catch((error) => {
				setLoading(false);
				console.error("Error fetching data:", error);
				setDeleteProgress(false)
				toast({
					variant: "destructive",
					title: "Server Error",
					description: "Something went wrong, please try again later.",
				})
			});
	}

	function AddManyUser() {
		setLoading(true);
		const payload = {
			Data: [...CSVData],
		};
		axios
			.post("http://localhost:5056/add_user", payload)
			.then((response) => {
				// Update the state with the fetched data
				console.log(response.data);
				setData((prev) => [...prev, ...response.data]);
				setCSVDisplayed(false);
				setCSVData([]);
				setLoading(false);
				toast({
					title: "Users Added",
					description: "Users has been added successfully to the server.",
				})
			})
			.catch((error) => {
				setLoading(false);
				console.error("Error fetching data:", error);
				toast({
					variant: "destructive",
					title: "Server Error",
					description: "Something went wrong, please try again later.",
				})
			});
	}


	return (
		<div className="m-5">
			<div className="w-full -mt-7 mb-7 h-[50px] flex item-center justify-center">
				<img src="logo.png"></img>
			</div>
			{isCSVDisplayed ? (
				<div className="border mb-4 rounded-md shadow">
					<Table className="border-b">
						<TableHeader>
							<TableRow>
								<TableHead>First Name</TableHead>
								<TableHead>Last Name</TableHead>
								<TableHead>Email</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{CSVData.map((item, index) => (
								<CSVDisplay
									key={index}
									First_Name={item.First_Name}
									Last_Name={item.Last_Name}
									Email={item.Email}
								/>
							))}
						</TableBody>
					</Table>

					<div className="my-4 mx-2 flex space-x-3">
						<Button
							onClick={AddManyUser}
							disabled={Loading && true}
							className="bg-green-500 h-10 w-[110px]">
							{Loading ? "Adding.." : "Add Users"}
						</Button>
						<Button
							onClick={() => {
								setCSVDisplayed(false);
								setCSVData([]);
							}}
							disabled={Loading && true}
							className="bg-red-500 h-10 w-[110px]">
							Cancel
						</Button>
					</div>
				</div>
			) : (
				<div className="bg-white p-4 rounded-md shadow mb-4 flex flex-col space-y-3">
					<div className="flex w-full space-x-2">
						<div className="flex w-1/2 flex-col space-y-2">
							<p className="text-slate-600">First Name</p>
							<div className="flex space-x-1 h-10 items-center justify-center">
								<Input
									type="text"
									value={First_Name}
									onChange={(e) =>
										setFirst_Name(e.target.value)
									}
									className="w-full h-full border border-gray-300 rounded"
									required
								/>
							</div>
						</div>
						<div className="flex w-1/2 flex-col space-y-2">
							<p className="text-slate-600">Last Name</p>
							<div className="flex space-x-1 h-10 items-center justify-center">
								<Input
									type="text"
									value={Last_Name}
									onChange={(e) =>
										setLast_Name(e.target.value)
									}
									className="w-full h-full border border-gray-300 rounded"
									required
								/>
							</div>
						</div>
					</div>
					<div className="flex flex-col space-y-2">
						<p className="text-slate-600">Email</p>
						<div className="flex space-x-1 h-10 items-center justify-center">
							<Input
								type="text"
								value={Email}
								onChange={(e) => setEmail(e.target.value)}
								className="w-full h-full border border-gray-300 rounded"
								required
							/>
						</div>
					</div>
					<div className="flex space-x-2 items-center">
						<Button
							onClick={AddUser}
							disabled={Loading && true}
							className="bg-green-500 h-10 w-[100px]">
							{Loading ? "Adding.." : "Add User"}
						</Button>
						{!isUploaderOpen ? (
							<div>
								<Button
									onClick={() => {
										setisUploaderOpen(true);
									}}
									disabled={Loading && true}
									className="bg-green-500 h-10 w-[110px]">
									Upload CSV
								</Button>
								<a
									className="text-sm px-5 underline text-blue-500"
									href="Sample.csv">
									Sample CSV
								</a>
							</div>
						) : (
							<div className="p-1 border-2 bg-green-100 h-10 rounded-md flex items-center justify-center border-green-500">
								<CSVReader onFileLoaded={handleFile} />
								<button
									onClick={() => {
										setisUploaderOpen(false);
									}}
									className="fas fa-xmark p-2 text-red-500 hover:text-red-500/80"></button>
							</div>
						)}
					</div>
				</div>
			)}

			<div className="border rounded-md shadow">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>First Name</TableHead>
							<TableHead>Last Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>License Key</TableHead>
							<TableHead>Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.map((item, index) => (
							<Users
								key={index}
								First_Name={item.First_Name}
								Last_Name={item.Last_Name}
								Email={item.Email}
								License_Key={item.License_Key}
							/>
						))}
					</TableBody>
				</Table>
				{isFetching && (
					<div className="w-full flex items-center my-3 justify-center">
						<i className="fas fa-spinner text-green-500 text-3xl opacity-50 animate-spin"></i>
					</div>
				)}
			</div>
			<Toaster />
		</div>
	);
};

export default LicenseRegistration;
