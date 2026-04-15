// src/components/TaskList/TaskList.tsx
import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { usePomodoroStore, type Task } from '../../store/pomodoroStore'
import styles from './TaskList.module.css'

function SortableTaskItem({ task }: { task: Task }) {
  const toggleTask = usePomodoroStore((s) => s.toggleTask)
  const deleteTask = usePomodoroStore((s) => s.deleteTask)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
      className={styles.taskItem}
    >
      <span className={styles.dragHandle} {...attributes} {...listeners}>
        ⠿
      </span>
      <input
        type="checkbox"
        checked={task.done}
        onChange={() => toggleTask(task.id)}
        className={styles.checkbox}
        id={`task-${task.id}`}
      />
      <label htmlFor={`task-${task.id}`} className={styles.taskLabel}>
        {task.title}
      </label>
      <button
        className={styles.deleteBtn}
        onClick={() => deleteTask(task.id)}
        aria-label="Supprimer"
      >
        ✕
      </button>
    </div>
  )
}

function CompletedAccordion({ tasks }: { tasks: Task[] }) {
  const [open, setOpen] = useState(false)
  const toggleTask = usePomodoroStore((s) => s.toggleTask)

  if (tasks.length === 0) return null

  return (
    <div className={styles.accordion}>
      <button
        className={styles.accordionHeader}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className={styles.accordionArrow}>{open ? '▼' : '▶'}</span>
        {tasks.length} terminée{tasks.length > 1 ? 's' : ''}
      </button>
      {open && (
        <div className={styles.accordionBody}>
          {tasks.map((task) => (
            <div key={task.id} className={styles.taskItem}>
              <span className={styles.dragHandlePlaceholder} />
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
                className={styles.checkbox}
                id={`task-done-${task.id}`}
              />
              <label
                htmlFor={`task-done-${task.id}`}
                className={`${styles.taskLabel} ${styles.taskLabelDone}`}
              >
                {task.title}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AddTaskInput() {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const addTask = usePomodoroStore((s) => s.addTask)

  const submit = () => {
    if (value.trim()) addTask(value.trim())
    setValue('')
    setEditing(false)
  }

  if (!editing) {
    return (
      <button className={styles.addLink} onClick={() => setEditing(true)}>
        + Ajouter une tâche
      </button>
    )
  }

  return (
    <input
      className={styles.addInput}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          submit()
        } else if (e.key === 'Escape') {
          setValue('')
          setEditing(false)
        }
      }}
      onBlur={submit}
      autoFocus
      placeholder="Nouvelle tâche…"
    />
  )
}

export function TaskList() {
  const tasks = usePomodoroStore((s) => s.tasks)
  const reorderTasks = usePomodoroStore((s) => s.reorderTasks)

  const activeTasks = tasks.filter((t) => !t.done)
  const doneTasks = tasks.filter((t) => t.done)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      reorderTasks(String(active.id), String(over.id))
    }
  }

  return (
    <section className={styles.taskList}>
      <CompletedAccordion tasks={doneTasks} />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={activeTasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {activeTasks.map((task) => (
            <SortableTaskItem key={task.id} task={task} />
          ))}
        </SortableContext>
      </DndContext>
      <AddTaskInput />
    </section>
  )
}
