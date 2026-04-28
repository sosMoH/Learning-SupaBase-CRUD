import { useEffect, useState } from "react";
import supabase from "./supabase-client";
import TodoListItems from "./components/TodoListItems";
import Auth from "./components/Auth";

const App = () => {
  // Session Tracking Part
  const [session, setSession] = useState(null);
  // Get Session
  const fetchSession = async () => {
    const currentSession = await supabase.auth.getSession();
    console.log(currentSession);
    setSession(currentSession.data.session);
  };

  useEffect(() => {
    fetchSession();

    // Auto Switch Sessoin
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // CLEAN UP when Logged Out
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  // Logout
  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      {session ? (
        <>
          <button onClick={logout}>Log Out</button>
          <TodoListItems session={session} />
        </>
      ) : (
        <Auth />
      )}
    </>
  );
};

export default App;
