const GymTokMainPage = () => {
    return (
        <Router>
            <div className="flex w-screen h-screen overflow-hidden bg-[#1E1E1E] text-white">
                <Sidebar />
                <main className="flex-grow flex justify-center items-center overflow-hidden w-full flex-col">
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/explore" element={<ExplorePage />} />
                        <Route path="/upload" element={<UploadPage />} />
                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="/login" element={<LoginPage />} />
                    </Routes>
                </main>
            </div>
        </Router>
    );
};

export default GymTokMainPage;
