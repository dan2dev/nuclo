import { useState, useEffect } from 'react'
import './App.css'

type Todo = {
  id: number;
  text: string;
  completed: boolean;
};

function App() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: "Learn Nuclo", completed: false },
    { id: 2, text: "Build a Todo App", completed: false },
    { id: 3, text: "Deploy to Production", completed: false },
  ]);
  const [nextId, setNextId] = useState(4);
  const [inputValue, setInputValue] = useState("");
  const [visible, setVisible] = useState(false);
  const [counter, setCounter] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    let intervalId: number | undefined;
    if (isPlaying) {
      intervalId = setInterval(() => {
        setCounter((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };
  }, [isPlaying]);

  const addTodo = () => {
    if (!inputValue.trim()) return;
    setTodos([...todos, { id: nextId, text: inputValue.trim(), completed: false }]);
    setNextId(nextId + 1);
    setInputValue("");
  };

  const toggleTodo = (id: number) => {
    setTodos(todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      addTodo();
    }
  };

  return (
    <div className="body">
      <div className="container">
        <h1 className="header">📝 Todo List</h1>

        <div className="input-container">
          <input
            className="input"
            type="text"
            placeholder="What needs to be done?"
            value={inputValue}
            onInput={(e) => setInputValue((e.target as HTMLInputElement).value)}
            onKeyDown={handleKeyDown}
          />
          <button className="add-button" onClick={addTodo}>Add</button>
        </div>

        <div>
          <input
            type="checkbox"
            id="visibilityToggle"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
          />
          <span>is this visible: </span>
          {visible ? "yes" : "no"}
        </div>

        <div className="input-container">
          <button
            className="add-button"
            onClick={() => setIsPlaying(true)}
          >
            Play
          </button>
          <button
            className="delete-button"
            onClick={() => setIsPlaying(false)}
          >
            Stop
          </button>
        </div>

        <div>
          <button onClick={() => setCounter(counter + 1)}>Increment Counter</button>
          <div>Counter: {counter}</div>
        </div>

        {todos.length === 0 ? (
          <div>No todos yet! Add one above.</div>
        ) : (
          <div className="todo-list">
            {todos.map((todo) => (
              <div key={todo.id} className="todo-item">
                <span className="drag-handle">⇅</span>
                <input
                  className="checkbox"
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                />
                <span className={todo.completed ? "todo-text-completed" : "todo-text"}>
                  {todo.text}
                </span>
                <button className="delete-button" onClick={() => deleteTodo(todo.id)}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
