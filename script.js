const apiBaseUrl = 'https://66b6115693a4f24a662b.appwrite.global/api';

// Funzione per ottenere gli elementi sacri
async function fetchElementiSacri() {
    try {
        const response = await fetch(`${apiBaseUrl}?endpoint=getElementoSacro`);
        const data = await response.json();
        displayElementiSacri(data);
    } catch (error) {
        console.error('Errore nel recupero degli elementi sacri:', error);
    }
}

async function fetchRelatedSacredPlaces(elementoId) {
    const elementDiv = document.querySelector(`[data-id="${elementoId}"]`); // Trova il div dell'elemento

    // Effettua la richiesta per ottenere i luoghi correlati
    try {
        const response = await fetch(`${apiBaseUrl}?endpoint=getRelatedSacredPlaces&elementoSacroId=${elementoId}`);
        const relatedPlaces = await response.json();

        if (relatedPlaces.length > 0) {
            // Crea una lista per visualizzare i luoghi correlati
            const relatedList = document.createElement('ul');
            relatedPlaces.forEach(place => {
                const listItem = document.createElement('li');
                listItem.textContent = place.name; // Mostra il nome del luogo
                relatedList.appendChild(listItem);
            });

            // Aggiungi la lista di luoghi correlati al div dell'elemento
            elementDiv.appendChild(relatedList);
        } else {
            elementDiv.innerHTML += '<p>Nessun luogo sacro correlato trovato.</p>';
        }
    } catch (error) {
        console.error('Errore nel recupero dei luoghi correlati:', error);
        elementDiv.innerHTML += '<p>Errore nel recupero dei luoghi correlati.</p>';
    }
}


function displayElementiSacri(elementi) {
    const container = document.getElementById('elementsContainer');
    container.innerHTML = ''; // Pulisci il contenitore

    elementi.forEach(elemento => {
        const elementDiv = document.createElement('div');
        elementDiv.className = 'element';
        elementDiv.setAttribute('data-id', elemento._id); // Aggiungi l'attributo data-id

        elementDiv.innerHTML = `
            <strong>ID:</strong> ${elemento._id} <br>
            <strong>Nome:</strong> ${elemento.name} <br>
            <strong>Posizione:</strong> ${elemento.location} <br>
            <strong>Tipo:</strong> ${elemento.type} <br>
            <strong>Categoria:</strong> ${elemento.category} <br>
            <strong>Elemento Sacro Correlato:</strong> ${elemento.related_sacred_place || 'N/A'} <br>
            <strong>Coordinate:</strong> ${elemento.coordinates?.type} (${elemento.coordinates?.coordinates.join(', ')}) <br>
            <strong>Campi Dinamici:</strong> ${JSON.stringify(elemento.dynamicFields || {})} <br>
            <button onclick="editElemento('${elemento._id}')">Modifica</button>
            <button onclick="fetchRelatedSacredPlaces('${elemento._id}')">Vedi Luoghi Correlati</button>
        `;

        // Aggiungi il div dell'elemento al contenitore
        container.appendChild(elementDiv);
    });
}


// Funzione per modificare un elemento sacro
async function editElemento(elemento) {
    // Popola il campo del form con i campi dinamici esistenti
    const dynamicFields = Object.entries(elemento.dynamicFields || {}).map(([key, value]) => `${key}:${value}`).join(';');
    document.getElementById('dynamicFields').value = dynamicFields;

    // Mostra il modulo
    document.getElementById('editFormContainer').style.display = 'block';

    // Aggiungi un listener per il submit del form
    const form = document.getElementById('editElementForm');
    form.onsubmit = async (event) => {
        event.preventDefault(); // Evita il refresh della pagina

        const newFields = document.getElementById('dynamicFields').value;

        if (newFields) {
            const updateData = newFields.split(';').reduce((acc, field) => {
                const [key, value] = field.split(':');
                acc[key.trim()] = value.trim();
                return acc;
            }, {});

            try {
                const response = await fetch(`${apiBaseUrl}?endpoint=updateElementoSacro`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        identifier: elemento.name,
                        updateData: { dynamicFields: updateData }
                    })
                });

                const result = await response.json();
                if (result.success) {
                    alert('Elemento sacro aggiornato con successo!');
                    fetchElementiSacri(); // Ricarica gli elementi
                    closeEditForm(); // Chiudi il modulo
                } else {
                    alert('Errore nell\'aggiornamento dell\'elemento sacro');
                }
            } catch (error) {
                console.error('Errore nell\'aggiornamento dell\'elemento sacro:', error);
            }
        }
    };
}

// Funzione per chiudere il modulo di modifica
function closeEditForm() {
    document.getElementById('editFormContainer').style.display = 'none';
}


// Funzione per aggiungere un nuovo elemento sacro
document.getElementById('addElementForm').addEventListener('submit', async function(event) {
    event.preventDefault(); // Impedisce il comportamento predefinito del form

    const coordinatesInput = document.getElementById('coordinates').value.split(',').map(coord => parseFloat(coord.trim()));
    const newElement = {
        id: Date.now().toString(), // Simula un ID generato
        name: document.getElementById('name').value,
        location: document.getElementById('location').value,
        type: document.getElementById('type').value,
        category: document.getElementById('category').value,
        related_sacred_place: document.getElementById('related').value || null,
        coordinates: {
            type: "Point",
            coordinates: coordinatesInput
        },
        dynamicFields: {}
    };

    // Aggiunge i campi dinamici all'elemento
    const dynamicFields = document.querySelectorAll('.dynamic-field');
    dynamicFields.forEach(field => {
        const key = field.querySelector('input:nth-of-type(1)').value;
        const value = field.querySelector('input:nth-of-type(2)').value;
        if (key && value) {
            newElement.dynamicFields[key] = value;
        }
    });

    try {
        const response = await fetch(`${apiBaseUrl}?endpoint=addElementoSacro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newElement)
        });

        const result = await response.json();
        if (result.success) {
            alert('Nuovo elemento sacro aggiunto con successo!');
            fetchElementiSacri(); // Ricarica gli elementi
            document.getElementById('addElementForm').reset(); // Resetta il form
            document.getElementById('dynamicFieldsContainer').innerHTML = ''; // Resetta i campi dinamici
        } else {
            alert('Errore nell\'aggiunta dell\'elemento sacro');
        }
    } catch (error) {
        console.error('Errore nell\'aggiunta dell\'elemento sacro:', error);
    }
});

// Aggiunge un campo dinamico
document.getElementById('addDynamicField').addEventListener('click', function() {
    const dynamicFieldDiv = document.createElement('div');
    dynamicFieldDiv.className = 'dynamic-field';
    dynamicFieldDiv.innerHTML = `
        <input type="text" placeholder="Nome campo (es. colore)">
        <input type="text" placeholder="Valore campo (es. rosso)">
        <button type="button" onclick="this.parentElement.remove()">Rimuovi</button>
    `;
    document.getElementById('dynamicFieldsContainer').appendChild(dynamicFieldDiv);
});

// Carica gli elementi sacri all'avvio della pagina
fetchElementiSacri();
