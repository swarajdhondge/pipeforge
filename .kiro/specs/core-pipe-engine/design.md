# Core Pipe Engine - Design Document

## Overview

The Core Pipe Engine is a visual data workflow system that resurrects Yahoo Pipes with modern technology. Users create pipes by connecting operators on a visual canvas, execute them to process data, and share them publicly or keep them private.

**Key Design Principles:**
- Plugin architecture for operators (extensible without modifying core)
- JSON-first design (pipes are portable JSON documents)
- Event-driven execution (async via Bull queues)
- Type safety everywhere (TypeScript strict mode)
- Try-before-signup UX (anonymous users can create/execute with limits)

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Visual Editor│  │ Browse Pipes │  │ User Profile │      │
│  │  (ReactFlow) │  │   (Search)   │  │   (Social)   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │ REST API
┌────────────────────────────┼─────────────────────────────────┐
│                         Backend                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Pipe Service │  │ Execution    │  │ Operator     │      │
│  │   (CRUD)     │  │  Service     │  │  Registry    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         ├──────────────────┴──────────────────┤              │
│         │                                     │              │
│  ┌──────▼──────┐                    ┌────────▼────────┐     │
│  │ PostgreSQL  │                    │  Bull Queue     │     │
│  │  (Pipes,    │                    │  (Async Exec)   │     │
│  │  Versions)  │                    │                 │     │
│  └─────────────┘                    └─────────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**Frontend:**
- Visual Editor: ReactFlow canvas for drag-drop operator composition
- Browse Pipes: Discovery, search, filtering, trending
- User Profile: View user's public pipes, social features

**Backend:**
- Pipe Service: CRUD operations, versioning, forking
- Execution Service: Orchestrates pipe execution, manages queue
- Operator Registry: Plugin system for discovering and managing operators

## Database Schema

### Tables

#### pipes
```sql
CREATE TABLE pipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  definition JSONB NOT NULL,  -- { nodes: [], edges: [] }
  is_public BOOLEAN DEFAULT false,
  tags TEXT[],
  like_count INTEGER DEFAULT 0,
  execution_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pipes_user_id ON pipes(user_id);
CREATE INDEX idx_pipes_is_public ON pipes(is_public);
CREATE INDEX idx_pipes_tags ON pipes USING GIN(tags);
CREATE INDEX idx_pipes_featured ON pipes(is_featured) WHERE is_featured = true;
```

#### pipe_versions
```sql
CREATE TABLE pipe_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipe_id UUID REFERENCES pipes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  definition JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_pipe_versions_pipe_id ON pipe_versions(pipe_id);
CREATE UNIQUE INDEX idx_pipe_versions_unique ON pipe_versions(pipe_id, version_number);
```

#### executions
```sql
CREATE TABLE executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipe_id UUID REFERENCES pipes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  result JSONB,
  error TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_executions_pipe_id ON executions(pipe_id);
CREATE INDEX idx_executions_user_id ON executions(user_id);
CREATE INDEX idx_executions_status ON executions(status);
```

#### pipe_likes
```sql
CREATE TABLE pipe_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pipe_id UUID REFERENCES pipes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(pipe_id, user_id)
);

CREATE INDEX idx_pipe_likes_pipe_id ON pipe_likes(pipe_id);
CREATE INDEX idx_pipe_likes_user_id ON pipe_likes(user_id);
```


## API Endpoints

### Pipe Management

**POST /api/v1/pipes**
- Create new pipe
- Auth: Optional (anonymous creates local-only)
- Body: `{ name, description, definition, is_public, tags }`
- Response: `{ id, name, description, definition, is_public, tags, created_at }`

**GET /api/v1/pipes/:id**
- Get pipe by ID
- Auth: Optional (public pipes only for anonymous)
- Response: `{ id, name, description, definition, is_public, tags, author, like_count, execution_count, created_at }`

**PUT /api/v1/pipes/:id**
- Update pipe (creates new version)
- Auth: Required (must own pipe)
- Body: `{ name, description, definition, is_public, tags }`
- Response: `{ id, version_number, updated_at }`

**DELETE /api/v1/pipes/:id**
- Delete pipe and all versions
- Auth: Required (must own pipe)
- Response: `204 No Content`

**GET /api/v1/pipes**
- List pipes (public or user's own)
- Auth: Optional
- Query: `?page=1&limit=20&search=query&tags=tag1,tag2&sort=popular|recent|most_used&user_id=uuid`
- Response: `{ items: [], total, page, limit }`

**POST /api/v1/pipes/:id/fork**
- Fork a pipe (create copy)
- Auth: Required
- Response: `{ id, name, forked_from }`

**GET /api/v1/pipes/:id/versions**
- Get version history (last 5)
- Auth: Required (must own pipe)
- Response: `{ versions: [{ version_number, created_at }] }`

**POST /api/v1/pipes/:id/versions/:version/restore**
- Restore a previous version (creates new version)
- Auth: Required (must own pipe)
- Response: `{ id, version_number }`

### Social Features

**POST /api/v1/pipes/:id/like**
- Like a pipe
- Auth: Required
- Response: `{ like_count }`

**DELETE /api/v1/pipes/:id/like**
- Unlike a pipe
- Auth: Required
- Response: `{ like_count }`

**GET /api/v1/pipes/trending**
- Get trending pipes (last 7 days)
- Auth: Optional
- Response: `{ items: [] }`

**GET /api/v1/pipes/featured**
- Get featured pipes
- Auth: Optional
- Response: `{ items: [] }`


### Execution

**POST /api/v1/executions**
- Execute a pipe
- Auth: Optional (anonymous limited to 5 executions)
- Body: `{ pipe_id, mode: 'sync' | 'async' }`
- Response (sync): `{ execution_id, status: 'completed', result }`
- Response (async): `{ execution_id, status: 'pending' }`

**GET /api/v1/executions/:id**
- Get execution status/result
- Auth: Optional (if pipe is public)
- Response: `{ id, status, result, error, started_at, completed_at }`

**GET /api/v1/executions**
- List user's executions
- Auth: Required
- Query: `?pipe_id=uuid&page=1&limit=20`
- Response: `{ items: [], total, page, limit }`

## Data Models

### Pipe Definition (JSONB)

```typescript
interface PipeDefinition {
  nodes: OperatorNode[];
  edges: Edge[];
  viewport?: { x: number; y: number; zoom: number };
}

interface OperatorNode {
  id: string;
  type: 'fetch' | 'filter' | 'sort' | 'transform';
  position: { x: number; y: number };
  data: {
    label: string;
    config: OperatorConfig;
  };
}

interface Edge {
  id: string;
  source: string;  // node id
  target: string;  // node id
  sourceHandle?: string;
  targetHandle?: string;
}

type OperatorConfig = 
  | FetchConfig 
  | FilterConfig 
  | SortConfig 
  | TransformConfig;

interface FetchConfig {
  url: string;
}

interface FilterConfig {
  rules: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'gt' | 'lt' | 'gte' | 'lte';
    value: any;
  }>;
}

interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

interface TransformConfig {
  mappings: Array<{
    source: string;  // supports dot notation
    target: string;
  }>;
}
```


## Backend Components

### Operator System (Plugin Architecture)

```typescript
// Base operator interface
interface IOperator {
  type: string;
  execute(input: any, config: any): Promise<any>;
  validate(config: any): ValidationResult;
}

// Operator registry
class OperatorRegistry {
  private operators: Map<string, IOperator> = new Map();
  
  register(operator: IOperator): void {
    this.operators.set(operator.type, operator);
  }
  
  get(type: string): IOperator | undefined {
    return this.operators.get(type);
  }
  
  list(): string[] {
    return Array.from(this.operators.keys());
  }
}

// Example: Fetch operator
class FetchOperator implements IOperator {
  type = 'fetch';
  
  async execute(input: any, config: FetchConfig): Promise<any> {
    // Validate URL (no localhost/private IPs)
    if (!this.isValidUrl(config.url)) {
      throw new Error('Invalid URL');
    }
    
    // Make HTTP request with timeout
    const response = await axios.get(config.url, {
      timeout: 30000,
      headers: { 'User-Agent': 'YahooPipes/1.0' }
    });
    
    // Parse JSON
    return response.data;
  }
  
  validate(config: FetchConfig): ValidationResult {
    if (!config.url) {
      return { valid: false, error: 'URL is required' };
    }
    if (!this.isValidUrl(config.url)) {
      return { valid: false, error: 'Invalid URL format' };
    }
    return { valid: true };
  }
  
  private isValidUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      // Block localhost and private IPs
      if (parsed.hostname === 'localhost' || 
          parsed.hostname.startsWith('127.') ||
          parsed.hostname.startsWith('192.168.') ||
          parsed.hostname.startsWith('10.')) {
        return false;
      }
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
```

### Pipe Execution Engine

```typescript
class PipeExecutor {
  constructor(
    private operatorRegistry: OperatorRegistry,
    private logger: Logger
  ) {}
  
  async execute(definition: PipeDefinition): Promise<any> {
    // Build execution graph
    const graph = this.buildGraph(definition);
    
    // Topological sort to get execution order
    const executionOrder = this.topologicalSort(graph);
    
    // Execute operators in order
    const results = new Map<string, any>();
    
    for (const nodeId of executionOrder) {
      const node = definition.nodes.find(n => n.id === nodeId);
      if (!node) continue;
      
      // Get operator
      const operator = this.operatorRegistry.get(node.type);
      if (!operator) {
        throw new Error(`Unknown operator type: ${node.type}`);
      }
      
      // Get input from previous operator
      const input = this.getInput(nodeId, definition.edges, results);
      
      // Execute operator
      try {
        const result = await operator.execute(input, node.data.config);
        results.set(nodeId, result);
      } catch (error) {
        throw new Error(`Operator ${nodeId} failed: ${error.message}`);
      }
    }
    
    // Return final result (last operator's output)
    const finalNodeId = executionOrder[executionOrder.length - 1];
    return results.get(finalNodeId);
  }
  
  private buildGraph(definition: PipeDefinition): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    
    for (const node of definition.nodes) {
      graph.set(node.id, []);
    }
    
    for (const edge of definition.edges) {
      const deps = graph.get(edge.target) || [];
      deps.push(edge.source);
      graph.set(edge.target, deps);
    }
    
    return graph;
  }
  
  private topologicalSort(graph: Map<string, string[]>): string[] {
    // Kahn's algorithm
    const inDegree = new Map<string, number>();
    const queue: string[] = [];
    const result: string[] = [];
    
    // Calculate in-degrees
    for (const [node, deps] of graph.entries()) {
      inDegree.set(node, deps.length);
      if (deps.length === 0) {
        queue.push(node);
      }
    }
    
    // Process queue
    while (queue.length > 0) {
      const node = queue.shift()!;
      result.push(node);
      
      // Reduce in-degree of dependent nodes
      for (const [n, deps] of graph.entries()) {
        if (deps.includes(node)) {
          const degree = inDegree.get(n)! - 1;
          inDegree.set(n, degree);
          if (degree === 0) {
            queue.push(n);
          }
        }
      }
    }
    
    // Check for cycles
    if (result.length !== graph.size) {
      throw new Error('Cycle detected in pipe definition');
    }
    
    return result;
  }
  
  private getInput(
    nodeId: string, 
    edges: Edge[], 
    results: Map<string, any>
  ): any {
    const incomingEdge = edges.find(e => e.target === nodeId);
    if (!incomingEdge) return null;
    return results.get(incomingEdge.source);
  }
}
```


### Async Execution with Bull Queue

```typescript
// Queue setup
import Queue from 'bull';

const executionQueue = new Queue('pipe-execution', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379')
  }
});

// Add job to queue
async function queueExecution(pipeId: string, userId: string): Promise<string> {
  const job = await executionQueue.add({
    pipeId,
    userId,
    timestamp: Date.now()
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    timeout: 300000  // 5 minutes
  });
  
  return job.id;
}

// Process jobs
executionQueue.process(async (job) => {
  const { pipeId, userId } = job.data;
  
  // Get pipe definition
  const pipe = await pipeService.get(pipeId, userId);
  
  // Create execution record
  const execution = await executionService.create({
    pipe_id: pipeId,
    user_id: userId,
    status: 'running'
  });
  
  try {
    // Execute pipe
    const result = await pipeExecutor.execute(pipe.definition);
    
    // Update execution record
    await executionService.update(execution.id, {
      status: 'completed',
      result,
      completed_at: new Date()
    });
    
    // Increment execution count
    await pipeService.incrementExecutionCount(pipeId);
    
  } catch (error) {
    // Update execution record with error
    await executionService.update(execution.id, {
      status: 'failed',
      error: error.message,
      completed_at: new Date()
    });
    
    throw error;  // Re-throw for Bull retry logic
  }
});
```


## Frontend Components

### Component Hierarchy

```
App
├── NavigationBar
├── Routes
│   ├── HomePage
│   │   ├── HeroSection
│   │   ├── TrendingPipes
│   │   └── FeaturedPipes
│   ├── BrowsePipesPage
│   │   ├── SearchBar
│   │   ├── FilterPanel (tags, sort)
│   │   └── PipeGrid
│   │       └── PipeCard (name, author, likes, tags)
│   ├── PipeDetailPage
│   │   ├── PipeHeader (name, author, actions)
│   │   ├── PipePreview (read-only ReactFlow)
│   │   └── ExecutionPanel
│   ├── PipeEditorPage
│   │   ├── OperatorPalette (left sidebar)
│   │   ├── Canvas (ReactFlow)
│   │   │   └── OperatorNode (custom node component)
│   │   ├── ConfigPanel (right sidebar)
│   │   │   ├── PipeSettings (when no operator selected)
│   │   │   └── OperatorConfig (when operator selected)
│   │   └── ResultsPanel (bottom)
│   ├── MyPipesPage
│   │   └── PipeList (user's pipes)
│   └── UserProfilePage
│       ├── UserInfo
│       └── PublicPipes
└── Modals
    ├── SignupPromptModal (after 5 executions)
    └── UnsavedChangesModal
```

### Redux Store Structure

```typescript
interface RootState {
  auth: AuthState;
  anonymous: AnonymousState;
  pipes: PipesState;
  canvas: CanvasState;
  execution: ExecutionState;
}

interface AnonymousState {
  executionCount: number;
  localPipes: Pipe[];
  showSignupPrompt: boolean;
}

interface PipesState {
  items: Pipe[];
  currentPipe: Pipe | null;
  trending: Pipe[];
  featured: Pipe[];
  isLoading: boolean;
  error: string | null;
}

interface CanvasState {
  nodes: OperatorNode[];
  edges: Edge[];
  selectedNode: string | null;
  viewport: { x: number; y: number; zoom: number };
  isDirty: boolean;
  history: {
    past: PipeDefinition[];
    future: PipeDefinition[];
  };
}

interface ExecutionState {
  current: Execution | null;
  history: Execution[];
  isExecuting: boolean;
  error: string | null;
}
```


### ReactFlow Integration

```typescript
// Custom operator node component
const OperatorNode: FC<NodeProps> = ({ data, selected }) => {
  const { label, config, status, error } = data;
  
  return (
    <div className={`
      operator-node 
      ${selected ? 'selected' : ''} 
      ${status === 'error' ? 'error' : ''}
      ${status === 'success' ? 'success' : ''}
    `}>
      <Handle type="target" position={Position.Top} />
      
      <div className="operator-header">
        <span className="operator-icon">{getIcon(data.type)}</span>
        <span className="operator-label">{label}</span>
      </div>
      
      {error && (
        <div className="operator-error">{error}</div>
      )}
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

// Canvas component
const Canvas: FC = () => {
  const dispatch = useDispatch();
  const { nodes, edges, viewport } = useSelector((state: RootState) => state.canvas);
  
  const onNodesChange = useCallback((changes: NodeChange[]) => {
    dispatch(updateNodes(changes));
  }, [dispatch]);
  
  const onEdgesChange = useCallback((changes: EdgeChange[]) => {
    dispatch(updateEdges(changes));
  }, [dispatch]);
  
  const onConnect = useCallback((connection: Connection) => {
    dispatch(addEdge(connection));
  }, [dispatch]);
  
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    dispatch(selectNode(node.id));
  }, [dispatch]);
  
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onNodeClick={onNodeClick}
      nodeTypes={{ operator: OperatorNode }}
      defaultViewport={viewport}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
};
```

### Pipe Chaining Controls

#### Edge Selection and Management

The canvas supports advanced edge (connection) management with visual feedback and multiple interaction methods.

**Redux State Extension:**
```typescript
interface CanvasState {
  nodes: OperatorNode[];
  edges: Edge[];
  selectedNode: string | null;
  selectedEdges: string[];  // NEW: Support multi-edge selection
  viewport: { x: number; y: number; zoom: number };
  isDirty: boolean;
  history: {
    past: PipeDefinition[];
    future: PipeDefinition[];
  };
}
```

**Edge Selection Component:**
```typescript
// Custom edge component with selection and hover states
const SelectableEdge: FC<EdgeProps> = ({ 
  id, 
  sourceX, 
  sourceY, 
  targetX, 
  targetY,
  selected,
  style 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const dispatch = useDispatch();
  
  const edgePath = getSmoothStepPath({
    sourceX, sourceY, targetX, targetY
  });
  
  const handleClick = (event: React.MouseEvent) => {
    event.stopPropagation();
    if (event.shiftKey) {
      // Multi-select: add to selection
      dispatch(addEdgeToSelection(id));
    } else {
      // Single select: replace selection
      dispatch(setSelectedEdges([id]));
    }
  };
  
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    dispatch(showEdgeContextMenu({ edgeId: id, x: event.clientX, y: event.clientY }));
  };
  
  return (
    <>
      {/* Invisible wider path for easier clicking */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ cursor: 'pointer' }}
      />
      {/* Visible edge */}
      <path
        d={edgePath}
        fill="none"
        stroke={selected ? '#3b82f6' : isHovered ? '#ef4444' : '#6b7280'}
        strokeWidth={selected ? 3 : isHovered ? 2.5 : 2}
        markerEnd={`url(#arrow-${selected ? 'selected' : isHovered ? 'hover' : 'default'})`}
      />
    </>
  );
};
```

**Edge Context Menu:**
```typescript
const EdgeContextMenu: FC<{ edgeId: string; x: number; y: number }> = ({ edgeId, x, y }) => {
  const dispatch = useDispatch();
  
  const handleDelete = () => {
    dispatch(saveToHistory());
    dispatch(removeEdge(edgeId));
    dispatch(hideEdgeContextMenu());
  };
  
  return (
    <div 
      className="absolute bg-white shadow-lg rounded-md border border-gray-200 py-1 z-50"
      style={{ left: x, top: y }}
    >
      <button
        onClick={handleDelete}
        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2"
      >
        <TrashIcon className="w-4 h-4" />
        Delete Connection
      </button>
    </div>
  );
};
```

#### Operator Naming

Operators support custom user-defined labels that persist with the pipe definition.

**Label Generation:**
```typescript
// Generate default label based on type and sequence
function generateOperatorLabel(type: string, existingNodes: OperatorNode[]): string {
  const sameTypeNodes = existingNodes.filter(n => n.type === type);
  const nextNumber = sameTypeNodes.length + 1;
  const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
  return `${typeLabel} ${nextNumber}`;
}
```

**Inline Label Editing Component:**
```typescript
const EditableLabel: FC<{ nodeId: string; label: string }> = ({ nodeId, label }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(label);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  
  const validateLabel = (value: string): string | null => {
    if (!value.trim()) return 'Name is required';
    if (value.length > 50) return 'Name must be less than 50 characters';
    return null;
  };
  
  const handleDoubleClick = () => {
    setIsEditing(true);
    setEditValue(label);
    setTimeout(() => inputRef.current?.select(), 0);
  };
  
  const handleSave = () => {
    const validationError = validateLabel(editValue);
    if (validationError) {
      setError(validationError);
      return;
    }
    dispatch(updateNode({ id: nodeId, data: { label: editValue.trim() } }));
    setIsEditing(false);
    setError(null);
  };
  
  const handleCancel = () => {
    setEditValue(label);
    setIsEditing(false);
    setError(null);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };
  
  const handleBlur = () => {
    handleSave();
  };
  
  if (isEditing) {
    return (
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className={`text-sm font-semibold bg-white border rounded px-1 w-full ${
            error ? 'border-red-500' : 'border-blue-500'
          }`}
          maxLength={50}
          autoFocus
        />
        {error && (
          <div className="absolute top-full left-0 text-xs text-red-500 mt-1">
            {error}
          </div>
        )}
      </div>
    );
  }
  
  return (
    <div 
      className="text-sm font-semibold text-gray-900 cursor-text truncate"
      onDoubleClick={handleDoubleClick}
      title={label}
    >
      {label}
    </div>
  );
};
```

**Updated OperatorNode with Editable Label:**
```typescript
const OperatorNode: FC<NodeProps<OperatorNodeData>> = memo(({ id, data, selected }) => {
  const { label, status = 'idle', error } = data;

  return (
    <div className="relative">
      <Handle type="target" position={Position.Left} />
      
      <div className={`px-4 py-3 rounded-lg border-2 shadow-md min-w-[180px] ${getStatusStyles(status)} ${selected ? 'ring-2 ring-blue-400' : ''}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <EditableLabel nodeId={id} label={label} />
          </div>
          {getStatusIcon(status)}
        </div>
        
        {error && (
          <div className="mt-2 text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
            {error}
          </div>
        )}
      </div>
      
      <Handle type="source" position={Position.Right} />
    </div>
  );
});
```

#### Canvas Toolbar

```typescript
const CanvasToolbar: FC = () => {
  const dispatch = useDispatch();
  const { selectedEdges, edges } = useSelector((state: RootState) => state.canvas);
  const hasSelectedEdges = selectedEdges.length > 0;
  const hasEdges = edges.length > 0;
  
  const handleDeleteSelected = () => {
    if (hasSelectedEdges) {
      dispatch(saveToHistory());
      selectedEdges.forEach(edgeId => dispatch(removeEdge(edgeId)));
      dispatch(clearEdgeSelection());
    }
  };
  
  const handleClearAll = () => {
    if (hasEdges && window.confirm('Are you sure you want to remove all connections?')) {
      dispatch(saveToHistory());
      dispatch(clearAllEdges());
    }
  };
  
  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-md border border-gray-200 px-2 py-1 flex items-center gap-2 z-10">
      <button
        onClick={handleDeleteSelected}
        disabled={!hasSelectedEdges}
        className={`p-2 rounded ${hasSelectedEdges ? 'text-red-600 hover:bg-red-50' : 'text-gray-300 cursor-not-allowed'}`}
        title="Delete Selected Connection(s)"
      >
        <TrashIcon className="w-5 h-5" />
      </button>
      
      <div className="w-px h-6 bg-gray-200" />
      
      <button
        onClick={handleClearAll}
        disabled={!hasEdges}
        className={`p-2 rounded ${hasEdges ? 'text-gray-600 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}
        title="Clear All Connections"
      >
        <XCircleIcon className="w-5 h-5" />
      </button>
    </div>
  );
};
```

#### Connection Validation

```typescript
// Validate connection before creating edge
const isValidConnection = (connection: Connection, edges: Edge[], nodes: Node[]): { valid: boolean; error?: string } => {
  // Prevent self-connections
  if (connection.source === connection.target) {
    return { valid: false, error: 'Cannot connect operator to itself' };
  }
  
  // Check for cycles using DFS
  const adjacencyList = new Map<string, string[]>();
  
  // Build adjacency list from existing edges
  edges.forEach((edge) => {
    if (!adjacencyList.has(edge.source)) {
      adjacencyList.set(edge.source, []);
    }
    adjacencyList.get(edge.source)!.push(edge.target);
  });
  
  // Add the new connection temporarily
  if (!adjacencyList.has(connection.source!)) {
    adjacencyList.set(connection.source!, []);
  }
  adjacencyList.get(connection.source!)!.push(connection.target!);
  
  // DFS to detect cycles
  const visited = new Set<string>();
  const recStack = new Set<string>();
  
  const hasCycle = (node: string): boolean => {
    visited.add(node);
    recStack.add(node);
    
    const neighbors = adjacencyList.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) return true;
      } else if (recStack.has(neighbor)) {
        return true;
      }
    }
    
    recStack.delete(node);
    return false;
  };
  
  // Check for cycles starting from all nodes
  for (const nodeId of adjacencyList.keys()) {
    if (!visited.has(nodeId) && hasCycle(nodeId)) {
      return { valid: false, error: 'Cycle detected in pipe definition' };
    }
  }
  
  return { valid: true };
};
```

### Auto-save Implementation

```typescript
// Auto-save hook
const useAutoSave = (pipeId: string | null) => {
  const { nodes, edges, isDirty } = useSelector((state: RootState) => state.canvas);
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  
  useEffect(() => {
    if (!isDirty) return;
    
    const timer = setTimeout(async () => {
      const definition = { nodes, edges };
      
      if (isAuthenticated && pipeId) {
        // Save to database (draft)
        await pipeService.saveDraft(pipeId, definition);
      } else {
        // Save to localStorage
        localStorage.setItem(`pipe-draft-${pipeId || 'new'}`, JSON.stringify(definition));
      }
      
      dispatch(markClean());
    }, 30000);  // 30 seconds
    
    return () => clearTimeout(timer);
  }, [nodes, edges, isDirty, isAuthenticated, pipeId, dispatch]);
};
```


## Security Considerations

### Input Validation

**Pipe Definition Validation:**
```typescript
function validatePipeDefinition(definition: unknown): PipeDefinition {
  if (!definition || typeof definition !== 'object') {
    throw new ValidationError('Invalid pipe definition');
  }
  
  const { nodes, edges } = definition as any;
  
  // Validate nodes
  if (!Array.isArray(nodes)) {
    throw new ValidationError('Nodes must be an array');
  }
  
  if (nodes.length > 50) {
    throw new ValidationError('Maximum 50 operators per pipe');
  }
  
  for (const node of nodes) {
    if (!node.id || !node.type || !node.data) {
      throw new ValidationError('Invalid node structure');
    }
    
    // Validate operator config
    const operator = operatorRegistry.get(node.type);
    if (!operator) {
      throw new ValidationError(`Unknown operator type: ${node.type}`);
    }
    
    const validation = operator.validate(node.data.config);
    if (!validation.valid) {
      throw new ValidationError(`Invalid config for ${node.type}: ${validation.error}`);
    }
  }
  
  // Validate edges
  if (!Array.isArray(edges)) {
    throw new ValidationError('Edges must be an array');
  }
  
  for (const edge of edges) {
    if (!edge.source || !edge.target) {
      throw new ValidationError('Invalid edge structure');
    }
    
    // Check that source and target nodes exist
    if (!nodes.find(n => n.id === edge.source)) {
      throw new ValidationError(`Source node ${edge.source} not found`);
    }
    if (!nodes.find(n => n.id === edge.target)) {
      throw new ValidationError(`Target node ${edge.target} not found`);
    }
  }
  
  return definition as PipeDefinition;
}
```

### Rate Limiting

**Fetch Operator Rate Limiting:**
```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// Per-user rate limit for Fetch operator
const fetchRateLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'fetch-rate-limit:'
  }),
  windowMs: 60 * 1000,  // 1 minute
  max: 10,  // 10 requests per minute
  keyGenerator: (req) => req.user?.userId || req.ip,
  handler: (req, res) => {
    res.status(429).json({ 
      error: 'Too many requests. Maximum 10 requests per minute.' 
    });
  }
});

// Apply to execution endpoint
router.post('/executions', fetchRateLimiter, executionController.create);
```

**Anonymous Execution Limit:**
```typescript
// Middleware to check anonymous execution limit
async function checkAnonymousLimit(req: Request, res: Response, next: NextFunction) {
  if (req.user) {
    // Authenticated users have unlimited executions
    return next();
  }
  
  // Check localStorage-based limit (tracked client-side)
  // Server validates by checking session
  const sessionId = req.session?.id;
  if (!sessionId) {
    return res.status(401).json({ 
      error: 'Session required for anonymous execution' 
    });
  }
  
  const count = await redis.get(`anon-exec:${sessionId}`);
  if (count && parseInt(count) >= 5) {
    return res.status(403).json({ 
      error: 'Anonymous execution limit reached. Please sign up to continue.',
      limit: 5,
      remaining: 0
    });
  }
  
  // Increment count
  await redis.incr(`anon-exec:${sessionId}`);
  await redis.expire(`anon-exec:${sessionId}`, 86400);  // 24 hours
  
  next();
}
```

### Resource Limits

**Execution Timeouts:**
- Sync execution: 30 seconds
- Async execution: 5 minutes
- Fetch operator: 30 seconds per request

**Data Size Limits:**
- Max JSON response size: 1MB per operator output
- Max pipe definition size: 100KB
- Max operators per pipe: 50

**Concurrency Limits:**
- Max concurrent executions per user: 3
- Queue priority: authenticated users > anonymous users


## Error Handling

### Error Types

```typescript
// Custom error classes
export class PipeNotFoundError extends Error {
  constructor(pipeId: string) {
    super(`Pipe ${pipeId} not found`);
    this.name = 'PipeNotFoundError';
  }
}

export class UnauthorizedPipeAccessError extends Error {
  constructor(pipeId: string) {
    super(`Unauthorized access to pipe ${pipeId}`);
    this.name = 'UnauthorizedPipeAccessError';
  }
}

export class ExecutionTimeoutError extends Error {
  constructor(timeout: number) {
    super(`Execution timed out after ${timeout}ms`);
    this.name = 'ExecutionTimeoutError';
  }
}

export class OperatorExecutionError extends Error {
  constructor(operatorId: string, message: string) {
    super(`Operator ${operatorId} failed: ${message}`);
    this.name = 'OperatorExecutionError';
  }
}

export class CycleDetectedError extends Error {
  constructor() {
    super('Cycle detected in pipe definition');
    this.name = 'CycleDetectedError';
  }
}
```

### Error Handling in API

```typescript
// Global error handler middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('API error', { 
    error: error.message, 
    stack: error.stack,
    path: req.path,
    method: req.method
  });
  
  if (error instanceof ValidationError) {
    return res.status(400).json({ error: error.message });
  }
  
  if (error instanceof PipeNotFoundError) {
    return res.status(404).json({ error: error.message });
  }
  
  if (error instanceof UnauthorizedPipeAccessError) {
    return res.status(403).json({ error: error.message });
  }
  
  if (error instanceof ExecutionTimeoutError) {
    return res.status(408).json({ error: error.message });
  }
  
  // Generic error
  return res.status(500).json({ error: 'Internal server error' });
});
```

### Error Display in UI

```typescript
// Error boundary component
class PipeEditorErrorBoundary extends React.Component<Props, State> {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('React error boundary caught error', { error, errorInfo });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
          <button onClick={() => window.location.reload()}>
            Reload Editor
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Operator error display
const OperatorNode: FC<NodeProps> = ({ data }) => {
  const { error, status } = data;
  
  return (
    <div className={`operator-node ${status === 'error' ? 'error' : ''}`}>
      {/* ... */}
      {error && (
        <div className="operator-error-tooltip">
          <span className="error-icon">⚠️</span>
          <span className="error-message">{error}</span>
        </div>
      )}
    </div>
  );
};
```


## Performance Optimization

### Caching Strategy

**Pipe Definition Caching:**
```typescript
// Cache public pipes for 1 hour
async function getPipe(pipeId: string): Promise<Pipe> {
  const cacheKey = `pipe:${pipeId}`;
  
  // Try cache first
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Fetch from database
  const pipe = await db.query(
    'SELECT * FROM pipes WHERE id = $1',
    [pipeId]
  );
  
  if (!pipe.rows[0]) {
    throw new PipeNotFoundError(pipeId);
  }
  
  // Cache if public
  if (pipe.rows[0].is_public) {
    await redis.setEx(cacheKey, 3600, JSON.stringify(pipe.rows[0]));
  }
  
  return pipe.rows[0];
}

// Invalidate cache on update
async function updatePipe(pipeId: string, updates: Partial<Pipe>): Promise<void> {
  await db.query(
    'UPDATE pipes SET ... WHERE id = $1',
    [pipeId]
  );
  
  // Invalidate cache
  await redis.del(`pipe:${pipeId}`);
}
```

**Trending Pipes Caching:**
```typescript
// Cache trending calculation for 1 hour
async function getTrendingPipes(): Promise<Pipe[]> {
  const cacheKey = 'pipes:trending';
  
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }
  
  // Calculate trending (likes + executions in last 7 days)
  const result = await db.query(`
    SELECT p.*, 
           COUNT(DISTINCT pl.id) as recent_likes,
           COUNT(DISTINCT e.id) as recent_executions
    FROM pipes p
    LEFT JOIN pipe_likes pl ON p.id = pl.pipe_id 
      AND pl.created_at > NOW() - INTERVAL '7 days'
    LEFT JOIN executions e ON p.id = e.pipe_id 
      AND e.created_at > NOW() - INTERVAL '7 days'
    WHERE p.is_public = true
    GROUP BY p.id
    ORDER BY (recent_likes * 2 + recent_executions) DESC
    LIMIT 10
  `);
  
  // Cache for 1 hour
  await redis.setEx(cacheKey, 3600, JSON.stringify(result.rows));
  
  return result.rows;
}
```

### Database Optimization

**Indexes:**
- `idx_pipes_user_id` - for user's pipes queries
- `idx_pipes_is_public` - for public pipes queries
- `idx_pipes_tags` (GIN) - for tag-based search
- `idx_executions_pipe_id` - for execution history
- `idx_pipe_likes_pipe_id` - for like counts

**Query Optimization:**
```sql
-- Use EXPLAIN ANALYZE to verify query plans
EXPLAIN ANALYZE
SELECT p.*, u.name as author_name
FROM pipes p
JOIN users u ON p.user_id = u.id
WHERE p.is_public = true
  AND p.tags && ARRAY['weather', 'api']
ORDER BY p.like_count DESC
LIMIT 20;

-- Ensure indexes are used
-- Should see "Index Scan" not "Seq Scan"
```

### Frontend Optimization

**Code Splitting:**
```typescript
// Lazy load heavy components
const PipeEditorPage = lazy(() => import('./pages/PipeEditorPage'));
const BrowsePipesPage = lazy(() => import('./pages/BrowsePipesPage'));

// Wrap in Suspense
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/editor" element={<PipeEditorPage />} />
    <Route path="/pipes" element={<BrowsePipesPage />} />
  </Routes>
</Suspense>
```

**Memoization:**
```typescript
// Memoize expensive computations
const sortedPipes = useMemo(() => {
  return pipes.sort((a, b) => b.like_count - a.like_count);
}, [pipes]);

// Memoize callbacks
const handleLike = useCallback((pipeId: string) => {
  dispatch(likePipe(pipeId));
}, [dispatch]);
```

**Debouncing:**
```typescript
// Debounce search input
const [searchQuery, setSearchQuery] = useState('');
const debouncedSearch = useDebounce(searchQuery, 500);

useEffect(() => {
  if (debouncedSearch) {
    dispatch(searchPipes(debouncedSearch));
  }
}, [debouncedSearch, dispatch]);
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Operator Label Uniqueness and Sequencing

*For any* sequence of operator additions of the same type, the generated default labels SHALL follow a sequential pattern (e.g., "Fetch 1", "Fetch 2", "Fetch 3") with no duplicates.

**Validates: Requirements 22.1**

### Property 2: Operator Label Validation

*For any* string input as an operator label, the system SHALL accept it if and only if it is non-empty (after trimming whitespace) and has length ≤ 50 characters.

**Validates: Requirements 22.3**

### Property 3: Operator Label Round-Trip Persistence

*For any* pipe with custom operator labels, saving the pipe and then loading it SHALL restore all operator labels exactly as they were saved.

**Validates: Requirements 23.1, 23.2**

### Property 4: Fork Preserves Operator Labels

*For any* pipe with custom operator labels, forking the pipe SHALL create a new pipe where all operator labels match the original pipe's labels.

**Validates: Requirements 23.3**

### Property 5: Version Restore Preserves Operator Labels

*For any* pipe version with custom operator labels, restoring that version SHALL restore all operator labels from that specific version.

**Validates: Requirements 23.4**

### Property 6: Self-Connection Prevention

*For any* operator on the canvas, attempting to connect its output to its own input SHALL be rejected with the error "Cannot connect operator to itself".

**Validates: Requirements 5.9**

### Property 7: Cycle Detection

*For any* set of operators and edges, if adding a new edge would create a cycle in the directed graph, the connection SHALL be rejected with the error "Cycle detected in pipe definition".

**Validates: Requirements 5.10**

### Property 8: Multi-Edge Deletion

*For any* set of selected edges, pressing Delete SHALL remove all selected edges from the canvas in a single operation.

**Validates: Requirements 24.6**


## Testing Strategy

### Backend Testing

**Unit Tests:**
```typescript
describe('FetchOperator', () => {
  let operator: FetchOperator;
  
  beforeEach(() => {
    operator = new FetchOperator();
  });
  
  it('should fetch data from valid URL', async () => {
    const config = { url: 'https://api.example.com/data' };
    const result = await operator.execute(null, config);
    expect(result).toBeDefined();
  });
  
  it('should reject localhost URLs', async () => {
    const config = { url: 'http://localhost:3000/data' };
    await expect(operator.execute(null, config)).rejects.toThrow('Invalid URL');
  });
  
  it('should timeout after 30 seconds', async () => {
    const config = { url: 'https://slow-api.example.com/data' };
    await expect(operator.execute(null, config)).rejects.toThrow('timeout');
  });
});

describe('PipeExecutor', () => {
  let executor: PipeExecutor;
  let registry: OperatorRegistry;
  
  beforeEach(() => {
    registry = new OperatorRegistry();
    registry.register(new FetchOperator());
    registry.register(new FilterOperator());
    executor = new PipeExecutor(registry, logger);
  });
  
  it('should execute simple pipe', async () => {
    const definition = {
      nodes: [
        { id: '1', type: 'fetch', data: { config: { url: 'https://api.example.com/data' } } }
      ],
      edges: []
    };
    
    const result = await executor.execute(definition);
    expect(result).toBeDefined();
  });
  
  it('should detect cycles', async () => {
    const definition = {
      nodes: [
        { id: '1', type: 'fetch', data: { config: { url: 'https://api.example.com/data' } } },
        { id: '2', type: 'filter', data: { config: { rules: [] } } }
      ],
      edges: [
        { id: 'e1', source: '1', target: '2' },
        { id: 'e2', source: '2', target: '1' }  // Cycle!
      ]
    };
    
    await expect(executor.execute(definition)).rejects.toThrow('Cycle detected');
  });
});
```

**Integration Tests:**
```typescript
describe('Pipe API', () => {
  let authToken: string;
  
  beforeAll(async () => {
    // Create test user and get token
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });
    authToken = response.body.token;
  });
  
  it('should create pipe', async () => {
    const response = await request(app)
      .post('/api/v1/pipes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Pipe',
        description: 'Test description',
        definition: { nodes: [], edges: [] },
        is_public: false
      });
    
    expect(response.status).toBe(201);
    expect(response.body.id).toBeDefined();
  });
  
  it('should not allow anonymous users to save pipes', async () => {
    const response = await request(app)
      .post('/api/v1/pipes')
      .send({
        name: 'Test Pipe',
        definition: { nodes: [], edges: [] }
      });
    
    expect(response.status).toBe(401);
  });
});
```

### Frontend Testing

**Component Tests:**
```typescript
describe('OperatorPalette', () => {
  it('should render all operator types', () => {
    render(<OperatorPalette />);
    
    expect(screen.getByText('Fetch')).toBeInTheDocument();
    expect(screen.getByText('Filter')).toBeInTheDocument();
    expect(screen.getByText('Sort')).toBeInTheDocument();
    expect(screen.getByText('Transform')).toBeInTheDocument();
  });
  
  it('should add operator on click', () => {
    const mockDispatch = jest.fn();
    jest.spyOn(require('react-redux'), 'useDispatch').mockReturnValue(mockDispatch);
    
    render(<OperatorPalette />);
    
    fireEvent.click(screen.getByText('Fetch'));
    
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'canvas/addNode' })
    );
  });
});

describe('PipeCard', () => {
  const mockPipe = {
    id: '1',
    name: 'Test Pipe',
    description: 'Test description',
    author: { name: 'Test User' },
    like_count: 5,
    tags: ['weather', 'api']
  };
  
  it('should display pipe information', () => {
    render(<PipeCard pipe={mockPipe} />);
    
    expect(screen.getByText('Test Pipe')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('weather')).toBeInTheDocument();
  });
  
  it('should handle like button click', () => {
    const mockDispatch = jest.fn();
    jest.spyOn(require('react-redux'), 'useDispatch').mockReturnValue(mockDispatch);
    
    render(<PipeCard pipe={mockPipe} />);
    
    fireEvent.click(screen.getByRole('button', { name: /like/i }));
    
    expect(mockDispatch).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'pipes/like' })
    );
  });
});
```

### Manual Testing Scenarios

**Draft Management Testing:**
1. Create 5 drafts → Verify all appear in "Recent Drafts"
2. Try creating 6th draft → Verify error: "Maximum 5 drafts allowed"
3. Delete a draft → Verify it's removed from list
4. Publish draft as Public → Verify it appears in Browse Pipes
5. Publish draft as Private → Verify it only appears in your profile
6. Verify drafts are always private (toggle disabled when saving as draft)
7. Verify drafts don't appear in Browse Pipes, Trending, or Featured
8. Verify other users can't see your drafts

**Profile Page Testing:**
1. View own profile → Verify shows all pipes (public + private) + drafts
2. View other user's profile → Verify shows only their public pipes
3. Toggle visibility on own pipe → Verify updates immediately
4. Click "Edit" → Verify loads pipe in editor
5. Click "History" → Verify shows last 5 versions
6. Click "Delete" → Verify confirmation and removal
7. Verify "Create Pipe" button in main navigation
8. Verify simplified dropdown (only Profile + Logout)

**Anonymous User Testing:**
1. Create pipe without login → Verify stored in localStorage
2. Execute 5 times → Verify signup modal appears
3. Sign up → Verify drafts migrate to account
4. Verify editor state preserved during auth flow
5. Verify anonymous banner shows correct messaging


## Deployment Considerations

### Environment Variables

```bash
# Backend
DATABASE_URL=postgresql://user:pass@host:5432/pipes_prod
REDIS_URL=redis://host:6379
JWT_SECRET=<strong-random-secret>
SECRETS_ENCRYPTION_KEY=<64-char-hex-string>
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Frontend
VITE_API_URL=https://api.pipes.example.com/api/v1
VITE_GOOGLE_CLIENT_ID=<google-oauth-client-id>
```

### Database Migrations

```bash
# Run migrations on deployment
npm run migrate:up

# Rollback if needed
npm run migrate:down
```

### Monitoring

**Metrics to Track:**
- Pipe execution success rate
- Average execution time (p50, p95, p99)
- Queue depth (Bull)
- API response times
- Error rates by endpoint
- Cache hit rates

**Logging:**
```typescript
// Structured logging with Winston
logger.info('Pipe executed', {
  pipe_id: pipeId,
  user_id: userId,
  duration_ms: duration,
  status: 'completed'
});

logger.error('Execution failed', {
  pipe_id: pipeId,
  user_id: userId,
  error: error.message,
  stack: error.stack
});
```

**Alerts:**
- Execution failure rate > 10%
- Average execution time > 10 seconds
- Queue depth > 1000
- API error rate > 5%
- Database connection pool > 80%

### Scaling Strategy

**Horizontal Scaling:**
- Multiple API servers behind load balancer
- Multiple Bull workers processing queue
- Redis cluster for caching and queue
- Database read replicas for queries

**Vertical Scaling:**
- Increase API server resources (CPU, memory)
- Increase database resources
- Optimize queries with indexes

**Sharding (Future):**
- Shard pipes by user_id hash
- Route requests to appropriate shard
- Implement at 100K+ users


## Migration from Anonymous to Authenticated

### Local Pipe Migration Flow

**Frontend (on signup/login):**
```typescript
async function migrateLocalPipes(): Promise<void> {
  // Get local pipes from localStorage
  const localPipes = JSON.parse(localStorage.getItem('local-pipes') || '[]');
  
  if (localPipes.length === 0) return;
  
  try {
    // Send to backend for migration
    const response = await api.post('/auth/migrate-pipes', {
      pipes: localPipes
    });
    
    // Clear localStorage
    localStorage.removeItem('local-pipes');
    localStorage.removeItem('anon-execution-count');
    
    // Show success message
    toast.success(`${response.data.migrated} pipes saved to your account!`);
    
    // Refresh pipes list
    dispatch(fetchUserPipes());
    
  } catch (error) {
    logger.error('Failed to migrate local pipes', { error });
    toast.error('Failed to migrate your local pipes. Please try again.');
  }
}

// Call after successful login/register
useEffect(() => {
  if (isAuthenticated && !hasMigrated) {
    migrateLocalPipes();
    setHasMigrated(true);
  }
}, [isAuthenticated]);
```

**Backend (migration endpoint):**
```typescript
router.post('/auth/migrate-pipes', authenticateJWT, async (req, res) => {
  try {
    const { pipes } = req.body;
    const userId = req.user!.userId;
    
    if (!Array.isArray(pipes)) {
      return res.status(400).json({ error: 'Invalid pipes data' });
    }
    
    let migrated = 0;
    
    for (const pipe of pipes) {
      // Validate pipe definition
      const validated = validatePipeDefinition(pipe.definition);
      
      // Create pipe in database
      await db.query(`
        INSERT INTO pipes (user_id, name, description, definition, is_public, tags)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        userId,
        pipe.name || 'Untitled Pipe',
        pipe.description || '',
        validated,
        false,  // Private by default
        pipe.tags || []
      ]);
      
      migrated++;
    }
    
    logger.info('Migrated local pipes', { userId, count: migrated });
    
    return res.status(200).json({ migrated });
    
  } catch (error) {
    logger.error('Pipe migration failed', { error, userId: req.user?.userId });
    return res.status(500).json({ error: 'Migration failed' });
  }
});
```

## Open Questions & Decisions

### 1. Operator Output Visualization
**Question:** How to display intermediate operator outputs during execution?

**Decision:** Show in config panel when operator is selected. Store outputs in execution state during run.

### 2. Pipe Forking Behavior
**Question:** Should forked pipes maintain link to original? Show "forked from" badge?

**Decision:** Yes, store `forked_from` field. Show badge on pipe card. Don't copy execution history.

### 3. Version Restoration
**Question:** Should restoring a version overwrite current or create new version?

**Decision:** Create new version (preserves history). User can always go back.

### 4. Search Implementation
**Question:** Full-text search or simple LIKE queries?

**Decision:** Start with ILIKE on name/description. Add PostgreSQL full-text search if needed later.

### 5. Trending Algorithm
**Question:** How to weight likes vs executions for trending?

**Decision:** `(likes * 2 + executions)` in last 7 days. Likes weighted higher as they indicate quality.

### 6. Anonymous User Tracking
**Question:** How to track anonymous execution limit without accounts?

**Decision:** Use session ID stored in Redis. Client-side localStorage as backup. 24-hour expiry.

### 7. Execution Mode Selection
**Question:** Should system auto-detect sync vs async, or let user choose?

**Decision:** Auto-detect based on pipe complexity (node count, operator types). User can override.

