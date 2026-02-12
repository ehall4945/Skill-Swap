/*
ROOT APP COMPONENT

Responsible for:
- Rendering global layout (AppLayout)
- Rendering current page components

Later this is where routing will live (for now it auto routes to home page).
*/

import AppLayout from "./layout/AppLayout";
import Discover from "./pages/Discover";

function App() {
  return (
    <AppLayout>
      {/* Since home page and login page aren't created yet, automatically routes to discover page */}
      <Discover />
    </AppLayout>
  );
}

export default App;

