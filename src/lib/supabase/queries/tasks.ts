import { createClient } from '../client';
import type { Database } from '@/types/database.types';

const supabase = createClient();

type TaskRow = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export interface Task {
  id: string;
  workspaceId: string;
  title: string;
  subtext: string | null;
  type: 'TASK' | 'REMINDER' | 'INVOICE' | 'APPROVAL';
  source: 'TEXT' | 'VOICE' | 'UPLOAD';
  category: 'CUSTOMER' | 'SUPPLIER' | 'INVOICE' | 'PAYMENT' | 'COMPLAINT' | 'OTHER';
  assignedTo: string | null;
  createdBy: string;
  done: boolean;
  scheduledDate: string | null;
  scheduledTime: string | null;
  detailsCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch all tasks for a workspace
 */
export async function getTasks(workspaceId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }

  return data.map(mapTaskFromDb);
}

/**
 * Fetch tasks assigned to a specific user
 */
export async function getTasksByAssignee(workspaceId: string, userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('assigned_to', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }

  return data.map(mapTaskFromDb);
}

/**
 * Fetch a single task by ID
 */
export async function getTask(taskId: string): Promise<Task | null> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', taskId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch task: ${error.message}`);
  }

  return mapTaskFromDb(data);
}

/**
 * Create a new task
 */
export async function createTask(task: Omit<TaskInsert, 'id' | 'created_at' | 'updated_at'>): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert([task])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }

  return mapTaskFromDb(data);
}

/**
 * Update an existing task
 */
export async function updateTask(taskId: string, updates: TaskUpdate): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update task: ${error.message}`);
  }

  return mapTaskFromDb(data);
}

/**
 * Mark a task as done/undone
 */
export async function toggleTaskDone(taskId: string, done: boolean): Promise<Task> {
  return updateTask(taskId, { done });
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    throw new Error(`Failed to delete task: ${error.message}`);
  }
}

/**
 * Map database row to Task interface
 */
function mapTaskFromDb(row: TaskRow): Task {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    title: row.title,
    subtext: row.subtext,
    type: row.type,
    source: row.source,
    category: row.category,
    assignedTo: row.assigned_to,
    createdBy: row.created_by,
    done: row.done,
    scheduledDate: row.scheduled_date,
    scheduledTime: row.scheduled_time,
    detailsCount: row.details_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
