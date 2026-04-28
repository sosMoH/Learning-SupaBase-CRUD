import { useState, useEffect } from "react";
import supabase from "../supabase-client";

const TodoListItems = () => {
  const [todoList, setTodoList] = useState([]);
  const [newTodo, setNewTodo] = useState("");

  const addTodo = async () => {
    const newTodoData = {
      name: newTodo,
      isCompleted: false,
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

    setTodoList((prev) => [...prev, data]);
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
        <button onClick={addTodo}>Add ToDo Item</button>
      </div>
      <ul>
        {todoList.map((todo) => (
          <li key={todo.id}>
            <p>{todo.name}</p>
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
