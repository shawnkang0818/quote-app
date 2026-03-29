import { useEffect, useState } from "react";

function App() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    // 注意这里端口改成你能用的5001
    fetch("http://localhost:5001")
      .then(res => res.text())
      .then(data => setMessage(data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Frontend Connected</h1>
      <p className="mt-4 text-blue-600">{message}</p>
    </div>
  );
}

export default App;