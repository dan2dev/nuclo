import { getTodos, addTodo, setInputValue, addSubtask, getSubtaskInput, setSubtaskInput, toggleTask, deleteTask, clearCompleted } from './todoState.ts';

// Prepare
setInputValue('Top level A');
addTodo();
setInputValue('Top level B');
addTodo();

console.log('Initial todos', JSON.stringify(getTodos(), null, 2));

// Add a subtask to todo 0
setSubtaskInput(0, 'Subtask A1');
addSubtask(0);
setSubtaskInput(0, 'Subtask A2');
addSubtask(0);

// Add nested subtask to one of subtask
const todo0 = getTodos().find(t => t.id === 0);
const subId = todo0?.subTasks?.[0]?.id;
if (subId !== undefined) {
  setSubtaskInput(subId, 'Nested A1a');
  addSubtask(subId);
}

console.log('After nested additions', JSON.stringify(getTodos(), null, 2));

// Toggle nested subtask
if (subId !== undefined) {
  const nestedId = getTodos().find(t => t.id === 0)?.subTasks?.[0]?.subTasks?.[0]?.id;
  if (nestedId !== undefined) toggleTask(nestedId);
}

console.log('After toggle nested', JSON.stringify(getTodos(), null, 2));

// Delete nested subtask
if (subId !== undefined) {
  const nestedId = getTodos().find(t => t.id === 0)?.subTasks?.[0]?.subTasks?.[0]?.id;
  if (nestedId !== undefined) deleteTask(nestedId);
}

console.log('After delete nested', JSON.stringify(getTodos(), null, 2));

// Toggle parent to done, this should set subtasks done
toggleTask(0);

console.log('After toggle parent done', JSON.stringify(getTodos(), null, 2));

// Clear completed - should remove parent and subtasks done
clearCompleted();

console.log('After clearCompleted', JSON.stringify(getTodos(), null, 2));

console.log('Test script complete');
