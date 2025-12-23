<script lang="ts">
  import { onDestroy } from 'svelte';

  type Todo = {
    id: number;
    text: string;
    completed: boolean;
  };

  let todos: Todo[] = [
    { id: 1, text: "Learn Nuclo", completed: false },
    { id: 2, text: "Build a Todo App", completed: false },
    { id: 3, text: "Deploy to Production", completed: false },
  ];
  let nextId = 4;
  let inputValue = "";
  let visible = false;
  let counter = 0;
  let isPlaying = false;
  let intervalId: number | undefined;

  $: if (isPlaying) {
    if (intervalId === undefined) {
      intervalId = setInterval(() => {
        counter += 1;
      }, 1000);
    }
  } else {
    if (intervalId !== undefined) {
      clearInterval(intervalId);
      intervalId = undefined;
    }
  }

  onDestroy(() => {
    if (intervalId !== undefined) {
      clearInterval(intervalId);
    }
  });

  function addTodo() {
    if (!inputValue.trim()) return;
    todos = [...todos, { id: nextId, text: inputValue.trim(), completed: false }];
    nextId += 1;
    inputValue = "";
  }

  function toggleTodo(id: number) {
    todos = todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    );
  }

  function deleteTodo(id: number) {
    todos = todos.filter((todo) => todo.id !== id);
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      addTodo();
    }
  }
</script>

<div class="body">
  <div class="container">
    <h1 class="header">📝 Todo List</h1>

    <div class="input-container">
      <input
        class="input"
        type="text"
        placeholder="What needs to be done?"
        bind:value={inputValue}
        on:keydown={handleKeyDown}
      />
      <button class="add-button" on:click={addTodo}>Add</button>
    </div>

    <div>
      <input
        type="checkbox"
        id="visibilityToggle"
        bind:checked={visible}
      />
      <span>is this visible: </span>
      {visible ? "yes" : "no"}
    </div>

    <div class="input-container">
      <button
        class="add-button"
        on:click={() => isPlaying = true}
      >
        Play
      </button>
      <button
        class="delete-button"
        on:click={() => isPlaying = false}
      >
        Stop
      </button>
    </div>

    <div>
      <button on:click={() => counter += 1}>Increment Counter</button>
      <div>Counter: {counter}</div>
    </div>

    {#if todos.length === 0}
      <div>No todos yet! Add one above.</div>
    {:else}
      <div class="todo-list">
        {#each todos as todo (todo.id)}
          <div class="todo-item">
            <span class="drag-handle">⇅</span>
            <input
              class="checkbox"
              type="checkbox"
              checked={todo.completed}
              on:change={() => toggleTodo(todo.id)}
            />
            <span class={todo.completed ? "todo-text-completed" : "todo-text"}>
              {todo.text}
            </span>
            <button class="delete-button" on:click={() => deleteTodo(todo.id)}>
              Delete
            </button>
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
