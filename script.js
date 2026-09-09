const STORAGE_KEY = "kanban-board-data";

const kanbanBoard = document.getElementById("kanbanBoard");
const totalTasks = document.getElementById("totalTasks");

const taskModal = document.getElementById("taskModal");
const listModal = document.getElementById("listModal");

const taskForm = document.getElementById("taskForm");
const listForm = document.getElementById("listForm");

const taskIdInput = document.getElementById("taskId");
const taskListIdInput = document.getElementById("taskListId");
const taskTitleInput = document.getElementById("taskTitle");
const taskDescriptionInput = document.getElementById("taskDescription");

const listNameInput = document.getElementById("listName");
const editListIdInput = document.getElementById("editListId");

const taskModalTitle = document.getElementById("taskModalTitle");
const listModalTitle = document.getElementById("listModalTitle");

let draggedTaskId = null;
let draggedFromListId = null;

let boardData = loadBoard();

renderBoard();

function createId() {
    return Date.now().toString() + Math.random().toString(36).substring(2, 8);
}

function getDefaultBoard() {
    return {
        lists: [
            {
                id: createId(),
                title: "Incompleted",
                tasks: [
                    {
                        id: createId(),
                        title: "Design landing page",
                        description: "Create the first version of the portfolio landing page."
                    },
                    {
                        id: createId(),
                        title: "Build navigation",
                        description: "Create responsive navigation for desktop and mobile."
                    }
                ]
            },
            {
                id: createId(),
                title: "Completed",
                tasks: [
                    {
                        id: createId(),
                        title: "Create project structure",
                        description: "Set up HTML, CSS and JavaScript files."
                    }
                ]
            }
        ]
    };
}

function loadBoard() {
    const savedBoard = localStorage.getItem(STORAGE_KEY);

    if (!savedBoard) {
        const defaultBoard = getDefaultBoard();

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(defaultBoard)
        );

        return defaultBoard;
    }

    try {
        return JSON.parse(savedBoard);
    } catch (error) {
        console.error("Could not load saved board:", error);

        return getDefaultBoard();
    }
}

function saveBoard() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(boardData)
    );
}

function renderBoard() {
    kanbanBoard.innerHTML = "";

    let taskCount = 0;

    boardData.lists.forEach((list) => {
        taskCount += list.tasks.length;

        const listElement = createListElement(list);

        kanbanBoard.appendChild(listElement);
    });

    totalTasks.textContent = taskCount;
}

function createListElement(list) {
    const listElement = document.createElement("div");

    listElement.className = "kanban-list";
    listElement.dataset.listId = list.id;

    const listHeader = document.createElement("div");

    listHeader.className = "list-header";

    const titleArea = document.createElement("div");

    titleArea.className = "list-title-area";

    const title = document.createElement("h2");

    title.className = "list-title";
    title.textContent = list.title;

    const count = document.createElement("span");

    count.className = "list-count";
    count.textContent = list.tasks.length;

    titleArea.appendChild(title);
    titleArea.appendChild(count);

    const actions = document.createElement("div");

    actions.className = "list-actions";

    const editButton = document.createElement("button");

    editButton.className = "icon-btn";
    editButton.title = "Rename list";
    editButton.innerHTML = "✎";

    editButton.addEventListener("click", () => {
        openEditListModal(list.id);

        title.addEventListener("dblclick", (event) => {
    event.stopPropagation();

    makeListTitleEditable(title, list.id);
});
    });

    const deleteButton = document.createElement("button");

    deleteButton.className = "icon-btn delete-list";
    deleteButton.title = "Delete list";
    deleteButton.innerHTML = "×";

    deleteButton.addEventListener("click", () => {
        deleteList(list.id);
    });

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    listHeader.appendChild(titleArea);
    listHeader.appendChild(actions);

    const cardsContainer = document.createElement("div");

    cardsContainer.className = "list-cards";
    cardsContainer.dataset.listId = list.id;

    cardsContainer.addEventListener("dragover", handleDragOver);

    cardsContainer.addEventListener("dragenter", (event) => {
        event.preventDefault();
        cardsContainer.classList.add("drag-over");
    });

    cardsContainer.addEventListener("dragleave", (event) => {
        if (!cardsContainer.contains(event.relatedTarget)) {
            cardsContainer.classList.remove("drag-over");
        }
    });

    cardsContainer.addEventListener("drop", handleDrop);

    if (list.tasks.length === 0) {
        const emptyMessage = document.createElement("div");

        emptyMessage.className = "empty-list";
        emptyMessage.textContent = "Drop a task here";

        cardsContainer.appendChild(emptyMessage);
    } else {
        list.tasks.forEach((task) => {
            cardsContainer.appendChild(
                createTaskElement(task, list.id)
            );
        });
    }

    const addCardButton = document.createElement("button");

    addCardButton.className = "add-card-btn";
    addCardButton.textContent = "+ Add Card";

    addCardButton.addEventListener("click", () => {
        openAddTaskModal(list.id);
    });

    listElement.appendChild(listHeader);
    listElement.appendChild(cardsContainer);
    listElement.appendChild(addCardButton);

    return listElement;
}

function makeListTitleEditable(element, listId) {
    const list = boardData.lists.find(
        (item) => item.id === listId
    );

    if (!list) {
        return;
    }

    const originalTitle = list.title;

    element.contentEditable = "true";
    element.focus();

    const range = document.createRange();

    range.selectNodeContents(element);

    const selection = window.getSelection();

    selection.removeAllRanges();
    selection.addRange(range);

    function saveListEdit() {
        const newTitle = element.textContent.trim();

        if (newTitle) {
            list.title = newTitle;
        } else {
            list.title = originalTitle;
        }

        element.contentEditable = "false";

        saveBoard();
        renderBoard();

        element.removeEventListener("blur", saveListEdit);
        element.removeEventListener("keydown", handleListKeyDown);
    }

    function handleListKeyDown(event) {
        if (event.key === "Enter") {
            event.preventDefault();

            element.blur();
        }

        if (event.key === "Escape") {
            element.textContent = originalTitle;

            element.blur();
        }
    }

    element.addEventListener("blur", saveListEdit);
    element.addEventListener("keydown", handleListKeyDown);
}
function createTaskElement(task, listId) {
    const card = document.createElement("article");

    card.className = "task-card";
    card.draggable = true;
    card.dataset.taskId = task.id;
    card.dataset.listId = listId;

    const title = document.createElement("h3");

    title.className = "task-title";
    title.textContent = task.title;

    const description = document.createElement("p");

    description.className = "task-description";

    if (task.description.trim()) {
        description.textContent = task.description;
    } else {
        description.textContent = "No description";
    }

    const footer = document.createElement("div");

    footer.className = "task-footer";

    const taskActions = document.createElement("div");

    taskActions.className = "task-actions";

    const editButton = document.createElement("button");

    editButton.className = "task-action";
    editButton.title = "Edit task";
    editButton.innerHTML = "✎";

    editButton.addEventListener("click", (event) => {
        event.stopPropagation();

        openEditTaskModal(task.id, listId);
    });

    const deleteButton = document.createElement("button");

    deleteButton.className = "task-action delete-task";
    deleteButton.title = "Delete task";
    deleteButton.innerHTML = "×";

    deleteButton.addEventListener("click", (event) => {
        event.stopPropagation();

        deleteTask(task.id, listId);
    });

    taskActions.appendChild(editButton);
    taskActions.appendChild(deleteButton);

    footer.appendChild(taskActions);

    card.appendChild(title);
    card.appendChild(description);
    card.appendChild(footer);

    card.addEventListener("dragstart", handleDragStart);

    card.addEventListener("dragend", handleDragEnd);

    title.addEventListener("dblclick", (event) => {
    event.stopPropagation();

    makeTextEditable(
        title,
        task.id,
        listId,
        "title"
    );
});

description.addEventListener("dblclick", (event) => {
    event.stopPropagation();

    makeTextEditable(
        description,
        task.id,
        listId,
        "description"
    );
});

    return card;
}

function openAddTaskModal(listId) {
    taskForm.reset();

    taskIdInput.value = "";
    taskListIdInput.value = listId;

    taskModalTitle.textContent = "Add New Task";

    openModal(taskModal);

    taskTitleInput.focus();
}

function openEditTaskModal(taskId, listId) {
    const list = boardData.lists.find(
        (item) => item.id === listId
    );

    if (!list) {
        return;
    }

    const task = list.tasks.find(
        (item) => item.id === taskId
    );

    if (!task) {
        return;
    }

    taskIdInput.value = task.id;
    taskListIdInput.value = list.id;
    taskTitleInput.value = task.title;
    taskDescriptionInput.value = task.description;

    taskModalTitle.textContent = "Edit Task";

    openModal(taskModal);

    taskTitleInput.focus();
}

taskForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const taskId = taskIdInput.value;
    const listId = taskListIdInput.value;

    const title = taskTitleInput.value.trim();
    const description = taskDescriptionInput.value.trim();

    if (!title) {
        return;
    }

    const list = boardData.lists.find(
        (item) => item.id === listId
    );

    if (!list) {
        return;
    }

    if (taskId) {
        const task = list.tasks.find(
            (item) => item.id === taskId
        );

        if (task) {
            task.title = title;
            task.description = description;
        }
    } else {
        list.tasks.push({
            id: createId(),
            title,
            description
        });
    }

    saveBoard();
    renderBoard();
    closeModal(taskModal);
});

function deleteTask(taskId, listId) {
    const list = boardData.lists.find(
        (item) => item.id === listId
    );

    if (!list) {
        return;
    }

    const confirmed = confirm(
        "Are you sure you want to delete this task?"
    );

    if (!confirmed) {
        return;
    }

    list.tasks = list.tasks.filter(
        (task) => task.id !== taskId
    );

    saveBoard();
    renderBoard();
}

document.getElementById("openListModal").addEventListener(
    "click",
    () => {
        openAddListModal();
    }
);

function openAddListModal() {
    listForm.reset();

    editListIdInput.value = "";
    listModalTitle.textContent = "Add New List";

    openModal(listModal);

    listNameInput.focus();
}

function openEditListModal(listId) {
    const list = boardData.lists.find(
        (item) => item.id === listId
    );

    if (!list) {
        return;
    }

    editListIdInput.value = list.id;
    listNameInput.value = list.title;

    listModalTitle.textContent = "Rename List";

    openModal(listModal);

    listNameInput.focus();
}

listForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const listId = editListIdInput.value;
    const listName = listNameInput.value.trim();
    const duplicateList = boardData.lists.some(
    (list) =>
        list.title.toLowerCase() === listName.toLowerCase() &&
        list.id !== listId
);

if (duplicateList) {
    alert("A list with this name already exists.");

    return;
}

    if (!listName) {
        return;
    }

    if (listId) {
        const list = boardData.lists.find(
            (item) => item.id === listId
        );

        if (list) {
            list.title = listName;
        }
    } else {
        boardData.lists.push({
            id: createId(),
            title: listName,
            tasks: []
        });
    }

    saveBoard();
    renderBoard();
    closeModal(listModal);
});

function deleteList(listId) {
    const list = boardData.lists.find(
        (item) => item.id === listId
    );

    if (!list) {
        return;
    }

    if (boardData.lists.length === 1) {
        alert("You must keep at least one list.");

        return;
    }

    const taskMessage = list.tasks.length > 0
        ? ` This will also delete ${list.tasks.length} task(s).`
        : "";

    const confirmed = confirm(
        `Delete "${list.title}"?${taskMessage}`
    );

    if (!confirmed) {
        return;
    }

    boardData.lists = boardData.lists.filter(
        (item) => item.id !== listId
    );

    saveBoard();
    renderBoard();
}

function handleDragStart(event) {
    draggedTaskId = event.currentTarget.dataset.taskId;
    draggedFromListId = event.currentTarget.dataset.listId;

    event.currentTarget.classList.add("dragging");

    event.dataTransfer.effectAllowed = "move";

    event.dataTransfer.setData(
        "text/plain",
        draggedTaskId
    );
}

function handleDragEnd(event) {
    event.currentTarget.classList.remove("dragging");

    removeDropIndicator();

    document
        .querySelectorAll(".list-cards")
        .forEach((container) => {
            container.classList.remove("drag-over");
        });

    draggedTaskId = null;
    draggedFromListId = null;
}

function handleDragOver(event) {
    event.preventDefault();

    event.dataTransfer.dropEffect = "move";

    const container = event.currentTarget;

    container.classList.add("drag-over");

    const card = event.target.closest(".task-card");

    removeDropIndicator();

    if (!card || card.dataset.taskId === draggedTaskId) {
        return;
    }

    const rect = card.getBoundingClientRect();

    const middle = rect.top + rect.height / 2;

    const indicator = document.createElement("div");

    indicator.className = "drop-indicator";

    if (event.clientY < middle) {
        card.parentNode.insertBefore(
            indicator,
            card
        );
    } else {
        card.parentNode.insertBefore(
            indicator,
            card.nextSibling
        );
    }
}

function handleDrop(event) {
    event.preventDefault();

    const container = event.currentTarget;

    container.classList.remove("drag-over");

    removeDropIndicator();

    const targetListId = container.dataset.listId;

    if (!draggedTaskId || !draggedFromListId) {
        return;
    }

    const droppedCard = event.target.closest(".task-card");

    if (
        draggedFromListId === targetListId &&
        droppedCard &&
        droppedCard.dataset.taskId !== draggedTaskId
    ) {
        reorderTask(
            draggedTaskId,
            targetListId,
            container,
            event
        );
    } else if (draggedFromListId !== targetListId) {
        moveTask(
            draggedTaskId,
            draggedFromListId,
            targetListId
        );
    }
}

function removeDropIndicator() {
    document
        .querySelectorAll(".drop-indicator")
        .forEach((indicator) => {
            indicator.remove();
        });
}

function moveTask(taskId, fromListId, toListId) {
    const sourceList = boardData.lists.find(
        (list) => list.id === fromListId
    );

    const targetList = boardData.lists.find(
        (list) => list.id === toListId
    );

    if (!sourceList || !targetList) {
        return;
    }

    const taskIndex = sourceList.tasks.findIndex(
        (task) => task.id === taskId
    );

    if (taskIndex === -1) {
        return;
    }

    const [task] = sourceList.tasks.splice(
        taskIndex,
        1
    );

    targetList.tasks.push(task);

    saveBoard();
    renderBoard();
}

function reorderTask(taskId, listId, container, event) {
    const list = boardData.lists.find(
        (item) => item.id === listId
    );

    if (!list) {
        return;
    }

    const oldIndex = list.tasks.findIndex(
        (task) => task.id === taskId
    );

    if (oldIndex === -1) {
        return;
    }

    const draggedTask = list.tasks[oldIndex];

    const cards = [
        ...container.querySelectorAll(".task-card")
    ].filter((card) => card.dataset.taskId !== taskId);

    let newIndex = cards.length;

    for (let index = 0; index < cards.length; index++) {
        const card = cards[index];

        const rect = card.getBoundingClientRect();

        const cardMiddle = rect.top + rect.height / 2;

        if (event.clientY < cardMiddle) {
            newIndex = index;
            break;
        }
    }

    list.tasks.splice(oldIndex, 1);

    list.tasks.splice(newIndex, 0, draggedTask);

    saveBoard();
    renderBoard();
}

function openModal(modal) {
    modal.classList.add("active");

    modal.setAttribute(
        "aria-hidden",
        "false"
    );

    document.body.style.overflow = "hidden";
}

function closeModal(modal) {
    modal.classList.remove("active");

    modal.setAttribute(
        "aria-hidden",
        "true"
    );

    document.body.style.overflow = "";
}

document.querySelectorAll("[data-close-modal]").forEach(
    (button) => {
        button.addEventListener("click", () => {
            const modalId =
                button.dataset.closeModal;

            const modal =
                document.getElementById(modalId);

            closeModal(modal);
        });
    }
);

document.querySelectorAll(".modal-overlay").forEach(
    (overlay) => {
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) {
                closeModal(overlay);
            }
        });
    }
);

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
        return;
    }

    document.querySelectorAll(".modal-overlay.active")
        .forEach((modal) => {
            closeModal(modal);
        });
});

function makeTextEditable(element, taskId, listId, field) {
    const list = boardData.lists.find(
        (item) => item.id === listId
    );

    if (!list) {
        return;
    }

    const task = list.tasks.find(
        (item) => item.id === taskId
    );

    if (!task) {
        return;
    }

    const originalText = task[field];

    element.contentEditable = "true";
    element.focus();

    const range = document.createRange();

    range.selectNodeContents(element);
    range.collapse(false);

    const selection = window.getSelection();

    selection.removeAllRanges();
    selection.addRange(range);

    function saveEdit() {
        const newValue = element.textContent.trim();

        if (newValue) {
            task[field] = newValue;
        } else {
            task[field] = originalText;
        }

        element.contentEditable = "false";

        saveBoard();
        renderBoard();

        element.removeEventListener("blur", saveEdit);
        element.removeEventListener("keydown", handleKeyDown);
    }

    function handleKeyDown(event) {
        if (event.key === "Enter" && field === "title") {
            event.preventDefault();

            element.blur();
        }

        if (event.key === "Escape") {
            element.textContent = originalText;

            element.blur();
        }
    }

    element.addEventListener("blur", saveEdit);
    element.addEventListener("keydown", handleKeyDown);
}