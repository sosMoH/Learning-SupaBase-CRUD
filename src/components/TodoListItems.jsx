import { useState, useEffect } from "react";
import supabase from "../supabase-client";

const TodoListItems = ({ session }) => {
  // TodoList Management Part
  const [todoList, setTodoList] = useState([]);
  const [newTodo, setNewTodo] = useState("");

  const addTodo = async () => {
    let imageUrl = null;

    if(taskImage){
      imageUrl = await uploadImage(taskImage);
    }

    const newTodoData = {
      name: newTodo,
      isCompleted: false,
      user_id: session.user.id,
      image_url: imageUrl,
    };

    const { data, error } = await supabase
      .from("TodoList")
      .insert(newTodoData)
      .select()
      .single();

    if (error) {
      console.log("Error Adding Task: ", error.message);
      return;
    }

    setNewTodo("");
  };

  const fetchTodo = async () => {
    const { error, data } = await supabase
      .from("TodoList")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.log("Error Showing Tasks: ", error.message);
      return;
    }

    setTodoList(data);
  };

  const toggleCompleted = async (id, currentStatus) => {
    const newStatus = !currentStatus;

    const { error } = await supabase
      .from("TodoList")
      .update({ isCompleted: newStatus })
      .eq("id", id);

    if (error) {
      console.log("Error Completing Task: ", error.message);
      return;
    }

    const updatedTodoList = todoList.map((todo) =>
      todo.id === id ? { ...todo, isCompleted: newStatus } : todo,
    );

    setTodoList(updatedTodoList);
  };

  const deleteTodo = async (id) => {
    const { error } = await supabase.from("TodoList").delete().eq("id", id);

    if (error) {
      console.log("Error Deleting Task: ", error.message);
      return;
    }

    setTodoList((prev) => prev.filter((todo) => todo.id !== id));
  };

  useEffect(() => {
    fetchTodo();
  }, []);

  // Session Subscription Part => REAL TIME
  useEffect(() => {
    const channel = supabase.channel("tasks-table");

    channel
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "TodoList" },
        (payload) => {
          // 2. Handle INSERT (New Task)
          if (payload.eventType === "INSERT") {
            const newTask = payload.new;
            setTodoList((prev) => {
              // Prevent duplication if the user who added it already has it on screen
              const taskExists = prev.some((todo) => todo.id === newTask.id);
              return taskExists ? prev : [...prev, newTask];
            });
          }

          // 3. Handle UPDATE (Toggle Completed)
          if (payload.eventType === "UPDATE") {
            const updatedTask = payload.new;
            setTodoList((prev) =>
              // Loop through and replace the old task with the updated one
              prev.map((todo) =>
                todo.id === updatedTask.id ? updatedTask : todo,
              ),
            );
          }

          // 4. Handle DELETE (Remove Task)
          if (payload.eventType === "DELETE") {
            // NOTE: For deletes, Supabase sends the data in payload.old, not payload.new!
            const deletedTaskId = payload.old.id;
            setTodoList((prev) =>
              // Filter out the task that matches the deleted ID
              prev.filter((todo) => todo.id !== deletedTaskId),
            );
          }
        },
      )
      .subscribe((status) => {
        console.log("Subscription: ", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Storage BUCKETS Part

  const [taskImage, setTaskImage] = useState(null)

  const handleFileChange = (e) => {
    if(e.target.files && e.target.files.length > 0){
      setTaskImage(e.target.files[0])
    }
  }

  const uploadImage = async (file) => {
    const filePath = `${file.name}-${Date.now()}`

    const {error} = await supabase.storage.from("TaskImage").upload(filePath, file);
    if(error) {console.error("Error Uploading Image: ", error.message); return;}
    
    const {data} = await supabase.storage.from("TaskImage").getPublicUrl(filePath);

    return data.publicUrl;
  }

  return (
    <div>
      <h1>ToDo List</h1>
      <div>
        <input
          type="text"
          placeholder="New Todo..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
        />
        <br />
        <input type="file" accept="image/*" onChange={handleFileChange} />
        <button onClick={addTodo}>Add ToDo Item</button>
      </div>
      <ul>
        {todoList.map((todo) => (
          <li key={todo.id}>
            <p>{todo.name}</p>
            <img src={todo.image_url} style={{width:"200px"}} />
            <br />
            <button onClick={() => toggleCompleted(todo.id, todo.isCompleted)}>
              {todo.isCompleted ? "Undo" : "Done"}
            </button>
            <br />
            <button onClick={() => deleteTodo(todo.id)}>Delete Todo</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TodoListItems;
