import { useState } from "react";
import "./App.css";
import Play from "./components/play/Play";
import TitlePage from "./components/title/TitlePage";

function App() {
    const [loggedIn, setLoggedIn] = useState(false);
    return <main className="app_wrapper">{!loggedIn ? <TitlePage setLoggedIn={setLoggedIn} /> : <Play />}</main>;
}

export default App;
