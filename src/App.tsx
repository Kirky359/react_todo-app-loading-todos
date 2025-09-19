/* eslint-disable max-len */
/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useState } from 'react';
import { USER_ID, addTodo, deleteTodo, getTodos } from './api/todos';
import classNames from 'classnames';
import { Todo } from './types/Todo';

enum ERROR {
  load,
  title,
  add,
  delete,
  update,
}

const errorMessage: Record<ERROR, string> = {
  [ERROR.load]: 'Unable to load todos',
  [ERROR.title]: 'Title should not be empty',
  [ERROR.add]: 'Unable to add a todo',
  [ERROR.delete]: 'Unable to delete a todo',
  [ERROR.update]: 'Unable to update a todo',
};

export const App: React.FC = () => {
  const [todos, setTodos] = useState<(Todo & { loading?: boolean })[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState<ERROR | null>(null);
  const [showError, setShowError] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const visibleTodos = todos.filter(todo => {
    switch (filter) {
      case 'active':
        return !todo.completed;
      case 'completed':
        return todo.completed;
      default:
        return true;
    }
  });

  useEffect(() => {
    if (error !== null) {
      setShowError(true);

      const timer = setTimeout(() => {
        setShowError(false);
        setError(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (!USER_ID) {
      return;
    }

    getTodos()
      .then(setTodos)
      .catch(() => {
        setError(ERROR.load);
      });
  }, []);

  const handleDelete = (id: number) => {
    setTodos(prev =>
      prev.map(todo => (todo.id === id ? { ...todo, loading: true } : todo)),
    );

    deleteTodo(id)
      .then(() => {
        setTimeout(() => {
          setTodos(prev => prev.filter(todo => todo.id !== id));
        }, 200);
      })
      .catch(() => {
        setError(ERROR.delete);
      });
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!query.trim()) {
      setError(ERROR.title);

      return;
    }

    const tempId = Date.now();

    const newTodo: Todo & { loading: boolean } = {
      id: tempId,
      userId: USER_ID,
      title: query.trim(),
      completed: false,
      loading: true,
    };

    setTodos(prev => [...prev, newTodo]);
    setQuery('');

    addTodo({
      userId: USER_ID,
      title: query.trim(),
      completed: false,
    })
      .then(todoFromServer => {
        setTimeout(() => {
          setTodos(prev =>
            prev.map(current =>
              current.id === tempId
                ? { ...todoFromServer, loading: false }
                : current,
            ),
          );
        }, 200);
      })
      .catch(() => {
        setError(ERROR.add);
        setTodos(prev => prev.filter(t => t.id !== tempId));
      });
  };

  const toggleTodo = (id: number) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo,
      ),
    );
  };

  const toggleAll = () => {
    const allCompleted = todos.every(todo => todo.completed);

    setTodos(prev => prev.map(todo => ({ ...todo, completed: !allCompleted })));
  };

  const clearCompleted = () => {
    setTodos(prev => prev.filter(todo => !todo.completed));
  };

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <header className="todoapp__header">
          {todos.length > 0 && (
            <button
              type="button"
              className="todoapp__toggle-all active"
              data-cy="ToggleAllButton"
              onClick={toggleAll}
            />
          )}

          <form onSubmit={handleSubmit}>
            <input
              data-cy="NewTodoField"
              type="text"
              className="todoapp__new-todo"
              value={query}
              placeholder="What needs to be done?"
              onChange={event => setQuery(event.target.value)}
            />
          </form>
        </header>

        <section className="todoapp__main" data-cy="TodoList">
          {visibleTodos.map(todo => (
            <div
              data-cy="Todo"
              className={classNames('todo', { completed: todo.completed })}
              key={todo.id}
            >
              <label className="todo__status-label">
                <input
                  data-cy="TodoStatus"
                  type="checkbox"
                  className="todo__status"
                  checked={todo.completed}
                  onChange={() => toggleTodo(todo.id)}
                />
              </label>

              <span data-cy="TodoTitle" className="todo__title">
                {todo.title}
              </span>

              <button
                type="button"
                className="todo__remove"
                data-cy="TodoDelete"
                disabled={todo.loading}
                onClick={() => handleDelete(todo.id)}
              >
                ×
              </button>

              <div
                data-cy="TodoLoader"
                className={classNames('modal overlay', {
                  'is-active': todo.loading,
                })}
              >
                <div className="modal-background has-background-white-ter" />
                <div className="loader" />
              </div>
            </div>
          ))}
        </section>

        {todos.length > 0 && (
          <footer className="todoapp__footer" data-cy="Footer">
            <span className="todo-count" data-cy="TodosCounter">
              {todos.filter(t => !t.completed).length} items left
            </span>

            <nav className="filter" data-cy="Filter">
              <a
                href="#/"
                className={classNames('filter__link', {
                  selected: filter === 'all',
                })}
                data-cy="FilterLinkAll"
                onClick={e => {
                  e.preventDefault();
                  setFilter('all');
                }}
              >
                All
              </a>

              <a
                href="#/active"
                className={classNames('filter__link', {
                  selected: filter === 'active',
                })}
                data-cy="FilterLinkActive"
                onClick={e => {
                  e.preventDefault();
                  setFilter('active');
                }}
              >
                Active
              </a>

              <a
                href="#/completed"
                className={classNames('filter__link', {
                  selected: filter === 'completed',
                })}
                data-cy="FilterLinkCompleted"
                onClick={e => {
                  e.preventDefault();
                  setFilter('completed');
                }}
              >
                Completed
              </a>
            </nav>

            <button
              type="button"
              className="todoapp__clear-completed"
              data-cy="ClearCompletedButton"
              disabled={!todos.some(t => t.completed)}
              onClick={clearCompleted}
            >
              Clear completed
            </button>
          </footer>
        )}
      </div>

      <div
        data-cy="ErrorNotification"
        className={classNames(
          'notification is-danger is-light has-text-weight-normal',
          { hidden: !showError },
        )}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => {
            setShowError(false);
            setError(null);
          }}
        />
        {error !== null ? errorMessage[error] : ''}
      </div>
    </div>
  );
};
