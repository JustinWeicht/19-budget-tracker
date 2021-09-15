let db;
const request = indexedDB.open('budget-tracker', 1);

// .onupgradeneeded is used when you change the db version
request.onupgradeneeded = (event) => {
    const db = event.target.result;
    db.createObjectStore('new_transaction', { autoIncrement: true });
}

// .onsuccess, uploadTransaction if onLine
request.onsuccess = (event) => {
    const db = event.target.result;
    if(navigator.onLine) {
        uploadTransaction();
    }
}

// .onerror to console.log() the errorCode
request.onerror = (event) => {
    console.log(event.target.errorCode);
}

// saveRecord() will stash data while not online
saveRecord = (record) => {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const objectStore = transaction.objectStore('new_transaction');
    objectStore.add(record);
}

// uploadTransaction() is used to upload the transaction once internet connection is reestablished
uploadTransaction = () => {
    const transaction = db.transaction(['new_transaction'], 'readwrite');
    const objectStore = transaction.objectStore('new_transaction');
    const allTransactions = objectStore.getAll();

    // .onsuccess is used to POST if the objectStore has data
    allTransactions.onsuccess = () => {
        if(allTransactions.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(allTransactions.result),
                headers: {
                    Accept: 'application/json, text/SecurityPolicyViolationEvent, */*',
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(transactionData => {
                if(transactionData.message) {
                    throw new Error(transactionData);
                }
                // make new transaction in the database
                const transaction = db.transaction(['new_transaction'], 'readwrite');
                const objectStore = transaction.objectStore('new_transaction');
                // clear the transactionDataStore
                objectStore.clear();
                alert('All saved transactions have been successfully submitted to database!')
            })
            .catch(err => console.log(err));
        }
    }
}

// addEventListener to await online connection
window.addEventListener('online', uploadTransaction);