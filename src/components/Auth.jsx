import { useState } from "react";
import supabase from "../supabase-client";

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });

      if (error) {
        console.error("Error Signing Up", error.message);
        return;
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Error Logging In", error.message);
        return;
      }
    }

    setEmail("");
    setPassword("");
  };

  return (
    <div>
      {isSignUp ? <h1>Sign Up</h1> : <h1>Login</h1>}
      <input
        onChange={(e) => setEmail(e.target.value)}
        value={email}
        type="email"
        placeholder="Email..."
      />
      <br />
      <input
        onChange={(e) => setPassword(e.target.value)}
        value={password}
        type="password"
        placeholder="Password..."
      />
      <br />
      <button onClick={handleSubmit}>{isSignUp ? "Sign Up" : "Login"}</button>
      <div>
        {isSignUp ? (
          <p>
            Already have an Account?
            <span onClick={() => setIsSignUp(!isSignUp)}> Switch to Login</span>
          </p>
        ) : (
          <p>
            Doesn't have an Account?
            <span onClick={() => setIsSignUp(!isSignUp)}>
              {" "}
              Switch to SignUp
            </span>
          </p>
        )}
      </div>
    </div>
  );
};

export default Auth;
