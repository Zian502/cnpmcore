import os from 'os';
import path from 'path';
import { Entity, EntityData } from './Entity';
import { EasyData, EntityUtil } from '../util/EntityUtil';
import { TaskType, TaskState } from '../../common/enum/Task';
import dayjs from '../../common/dayjs';

const HOST_NAME = os.hostname();
const PID = process.pid;

export interface TaskData extends EntityData {
  taskId: string;
  type: TaskType;
  state: TaskState;
  targetName: string;
  authorId: string;
  authorIp: string;
  data: any;
  logPath?: string;
  logStorePosition?: string;
  attempts?: number;
  error?: string;
  bizId?: string;
}

export type SyncPackageTaskOptions = {
  authorId?: string;
  authorIp?: string;
  tips?: string;
  skipDependencies?: boolean;
  syncDownloadData?: boolean;
  // force sync history version
  forceSyncHistory?: boolean;
};

export class Task extends Entity {
  taskId: string;
  type: TaskType;
  state: TaskState;
  targetName: string;
  authorId: string;
  authorIp: string;
  data: any;
  logPath: string;
  logStorePosition: string;
  attempts: number;
  error: string;
  bizId?: string;

  constructor(data: TaskData) {
    super(data);
    this.taskId = data.taskId;
    this.type = data.type;
    this.state = data.state;
    this.targetName = data.targetName;
    this.authorId = data.authorId;
    this.authorIp = data.authorIp;
    this.data = data.data;
    this.logPath = data.logPath ?? '';
    this.logStorePosition = data.logStorePosition ?? '';
    this.attempts = data.attempts ?? 0;
    this.error = data.error ?? '';
    this.bizId = data.bizId;
  }

  public resetLogPath() {
    this.logPath = `${path.dirname(this.logPath)}/${dayjs().format('DDHHmm')}-${this.taskId}-${this.attempts}.log`;
    this.logStorePosition = '';
  }

  public setExecuteWorker() {
    this.data.taskWorker = `${HOST_NAME}:${PID}`;
  }

  private static create(data: EasyData<TaskData, 'taskId'>): Task {
    const newData = EntityUtil.defaultData(data, 'taskId');
    return new Task(newData);
  }

  public static createSyncPackage(fullname: string, options?: SyncPackageTaskOptions): Task {
    const data = {
      type: TaskType.SyncPackage,
      state: TaskState.Waiting,
      targetName: fullname,
      authorId: options?.authorId ?? '',
      authorIp: options?.authorIp ?? '',
      data: {
        // task execute worker
        taskWorker: '',
        tips: options?.tips,
        skipDependencies: options?.skipDependencies,
        syncDownloadData: options?.syncDownloadData,
        forceSyncHistory: options?.forceSyncHistory,
      },
    };
    const task = this.create(data);
    task.logPath = `/packages/${fullname}/syncs/${dayjs().format('YYYY/MM/DDHHmm')}-${task.taskId}.log`;
    return task;
  }

  public static createChangesStream(targetName: string): Task {
    const data = {
      type: TaskType.ChangesStream,
      state: TaskState.Waiting,
      targetName,
      authorId: `pid_${PID}`,
      authorIp: HOST_NAME,
      data: {
        // task execute worker
        taskWorker: '',
        since: '',
      },
    };
    return this.create(data);
  }

  public static createSyncBinary(targetName: string, lastData: any): Task {
    const data = {
      type: TaskType.SyncBinary,
      state: TaskState.Waiting,
      targetName,
      authorId: `pid_${PID}`,
      authorIp: HOST_NAME,
      data: {
        // task execute worker
        taskWorker: '',
        ...lastData,
      },
    };
    const task = this.create(data);
    task.logPath = `/binaries/${targetName}/syncs/${dayjs().format('YYYY/MM/DDHHmm')}-${task.taskId}.log`;
    return task;
  }
}
