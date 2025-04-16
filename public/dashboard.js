// dashboard.js - Dashboard functionality for GoWheels

document.addEventListener('DOMContentLoaded', () => {
    const Dashboard = {
        config: {
            API_URL: 'http://localhost:3000/api'
        },
        state: {
            charts: {}
        },
        
        /**
         * Initialize the dashboard
         */
        init() {
            this.loadAvailableDrivers();
            this.loadDriverRatingsByCarType();
            this.loadAgeDemographics();
            this.loadPassengerAgeGroups();
        },
        
        /**
         * Make API request to the backend
         */
        async apiRequest(endpoint, method = 'GET', data = null) {
            try {
                const options = {
                    method,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
                
                if (data) {
                    options.body = JSON.stringify(data);
                }
                
                const response = await fetch(`${this.config.API_URL}${endpoint}`, options);
                
                if (!response.ok) {
                    throw new Error(`API request failed: ${response.statusText}`);
                }
                
                return await response.json();
            } catch (error) {
                console.error('API request error:', error);
                this.showAlert(`Error: ${error.message}`);
                return null;
            }
        },
        
        /**
         * Show alert message
         */
        showAlert(message) {
            alert(message);
        },
        
        /**
         * Load available drivers
         */
        async loadAvailableDrivers() {
            const drivers = await this.apiRequest('/drivers/available');
            
            if (!drivers) return;
            
            const countElement = document.getElementById('availableDriversCount');
            const listElement = document.getElementById('availableDriversList');
            
            countElement.textContent = drivers.length;
            
            if (drivers.length === 0) {
                listElement.innerHTML = '<p>No drivers available at the moment.</p>';
                return;
            }
            
            let html = '<ul class="drivers-list">';
            
            drivers.slice(0, 5).forEach(driver => {
                html += `
                    <li>
                        <div class="driver-info">
                            <span class="driver-name">${driver.Driver_Name}</span>
                            <span class="driver-rating">Rating: ${driver.Rating}/5</span>
                        </div>
                        <div class="car-info">
                            <span class="car-model">${driver.Car_Model}</span>
                            <span class="car-type">${driver.Car_Type}</span>
                        </div>
                    </li>
                `;
            });
            
            if (drivers.length > 5) {
                html += `<li class="more-drivers">+ ${drivers.length - 5} more drivers</li>`;
            }
            
            html += '</ul>';
            
            listElement.innerHTML = html;
        },
        
        /**
         * Load driver ratings by car type
         */
        async loadDriverRatingsByCarType() {
            const data = await this.apiRequest('/stats/ratings-by-car-type');
            
            if (!data) return;
            
            const ctx = document.getElementById('ratingsByCarTypeChart').getContext('2d');
            
            // Destroy existing chart if it exists
            if (this.state.charts.ratingsByCarType) {
                this.state.charts.ratingsByCarType.destroy();
            }
            
            this.state.charts.ratingsByCarType = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.map(item => item.Car_Type),
                    datasets: [
                        {
                            label: 'Average Rating',
                            data: data.map(item => item.Average_Rating),
                            backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            borderColor: 'rgba(54, 162, 235, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Driver Count',
                            data: data.map(item => item.Driver_Count),
                            backgroundColor: 'rgba(255, 99, 132, 0.5)',
                            borderColor: 'rgba(255, 99, 132, 1)',
                            borderWidth: 1,
                            yAxisID: 'y1'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Average Rating'
                            }
                        },
                        y1: {
                            beginAtZero: true,
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Driver Count'
                            },
                            grid: {
                                drawOnChartArea: false
                            }
                        }
                    }
                }
            });
        },
        
        /**
         * Load age demographics
         */
        async loadAgeDemographics() {
            const data = await this.apiRequest('/stats/age');
            
            if (!data) return;
            
            const ctx = document.getElementById('ageDemographicsChart').getContext('2d');
            
            // Destroy existing chart if it exists
            if (this.state.charts.ageDemographics) {
                this.state.charts.ageDemographics.destroy();
            }
            
            this.state.charts.ageDemographics = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: data.map(item => item.User_Type),
                    datasets: [
                        {
                            label: 'Average Age',
                            data: data.map(item => item.Average_Age),
                            backgroundColor: 'rgba(75, 192, 192, 0.5)',
                            borderColor: 'rgba(75, 192, 192, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Youngest Age',
                            data: data.map(item => item.Youngest_Age),
                            backgroundColor: 'rgba(153, 102, 255, 0.5)',
                            borderColor: 'rgba(153, 102, 255, 1)',
                            borderWidth: 1
                        },
                        {
                            label: 'Oldest Age',
                            data: data.map(item => item.Oldest_Age),
                            backgroundColor: 'rgba(255, 159, 64, 0.5)',
                            borderColor: 'rgba(255, 159, 64, 1)',
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: 'Age'
                            }
                        }
                    }
                }
            });
        },
        
        /**
         * Load passenger age groups
         */
        async loadPassengerAgeGroups() {
            const data = await this.apiRequest('/stats/passengers-by-age');
            
            if (!data) return;
            
            const ctx = document.getElementById('passengerAgeGroupsChart').getContext('2d');
            
            // Destroy existing chart if it exists
            if (this.state.charts.passengerAgeGroups) {
                this.state.charts.passengerAgeGroups.destroy();
            }
            
            this.state.charts.passengerAgeGroups = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: data.map(item => item.Age_Group),
                    datasets: [
                        {
                            data: data.map(item => item.Passenger_Count),
                            backgroundColor: [
                                'rgba(255, 99, 132, 0.5)',
                                'rgba(54, 162, 235, 0.5)',
                                'rgba(255, 206, 86, 0.5)',
                                'rgba(75, 192, 192, 0.5)',
                                'rgba(153, 102, 255, 0.5)'
                            ],
                            borderColor: [
                                'rgba(255, 99, 132, 1)',
                                'rgba(54, 162, 235, 1)',
                                'rgba(255, 206, 86, 1)',
                                'rgba(75, 192, 192, 1)',
                                'rgba(153, 102, 255, 1)'
                            ],
                            borderWidth: 1
                        }
                    ]
                },
                options: {
                    responsive: true,
                    plugins: {
                        legend: {
                            position: 'right'
                        }
                    }
                }
            });
        }
    };
    
    // Initialize the dashboard
    Dashboard.init();
});

// SQL Query Interface functionality
document.addEventListener('DOMContentLoaded', function() {
    const executeButtons = document.querySelectorAll('.execute-btn');
    
    executeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const queryBox = this.closest('.query-box');
            const queryInput = queryBox.querySelector('.query-input');
            const resultDiv = queryBox.querySelector('.query-result');
            
            // Show loading state
            resultDiv.innerHTML = 'Executing query...';
            button.disabled = true;
            
            // Execute query
            executeQuery(queryInput.value)
                .then(result => {
                    // Display results in a table format
                    displayQueryResults(result, resultDiv);
                })
                .catch(error => {
                    resultDiv.innerHTML = `Error: ${error.message}`;
                })
                .finally(() => {
                    button.disabled = false;
                });
        });
    });
});

async function executeQuery(query) {
    try {
        const response = await fetch('/api/execute-query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query })
        });
        
        if (!response.ok) {
            throw new Error('Query execution failed');
        }
        
        return await response.json();
    } catch (error) {
        throw new Error('Failed to execute query: ' + error.message);
    }
}

function displayQueryResults(results, container) {
    if (!results || !results.length) {
        container.innerHTML = 'No results found';
        return;
    }
    
    const table = document.createElement('table');
    table.className = 'query-results-table';
    
    // Create header row
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    Object.keys(results[0]).forEach(key => {
        const th = document.createElement('th');
        th.textContent = key;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    // Create data rows
    const tbody = document.createElement('tbody');
    results.forEach(row => {
        const tr = document.createElement('tr');
        Object.values(row).forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    
    container.innerHTML = '';
    container.appendChild(table);
}

// Add styles for the query results table
const style = document.createElement('style');
style.textContent = `
    .query-results-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
    }
    
    .query-results-table th,
    .query-results-table td {
        padding: 0.5rem;
        text-align: left;
        border: 1px solid #ddd;
    }
    
    .query-results-table th {
        background-color: #f8f9fa;
        font-weight: bold;
    }
    
    .query-results-table tr:nth-child(even) {
        background-color: #f8f9fa;
    }
    
    .query-results-table tr:hover {
        background-color: #f2f2f2;
    }
`;
document.head.appendChild(style); 