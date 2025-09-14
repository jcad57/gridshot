import Heading from "./Heading";

const TitlePage = ({ setLoggedIn }: { setLoggedIn: (loggedIn: boolean) => void }) => {
    return (
        <div className="title-page-wrapper">
            <Heading />
            <div className="title_menu_wrapper">
                <button onClick={() => setLoggedIn(true)}>Start Game</button>
            </div>
        </div>
    );
};

export default TitlePage;
