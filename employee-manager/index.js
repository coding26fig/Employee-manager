const mysql = require("mysql2");

const inquirer = require("inquirer");

const cTable = require("console.table");

const username = 'root'

const password = 'rootroot'

const database = 'employee_manager_db'

const connection = mysql.createConnection(
  `mysql://${username}:${password}@localhost:3306/${database}`
);

function start() {
  inquirer
    .prompt([
      {
        message: "What would you like to do?",
        type: "list",
        choices: [
          "view all departments",
          "view all roles",
          "view all employees",
          "add a department",
          "add a role",
          "add an employee",
          "update employee role",
          "quit",
        ],
        name: "initial",
      },
    ])
    .then((response) => {
      switch (response.initial) {
        case "view all departments":
          viewAllDepartments();
          break;
        case "view all roles":
          viewAllRoles();
          break;
        case "view all employees":
          viewAllEmployees();
          break;
        case "add a department":
          addADepartment();
          break;
        case "add a role":
          addARole();
          break;
        case "add an employee":
          addAnEmployee();
          break;
        case "update employee role":
          updateEmployeeRole();
          break
        case "quit":
          process.exit();
      }
    });
}

function updateEmployeeRole() {
  getEmployeeChoices()
  .then(employeeChoices => 
    {
    getRoleChoices()
    .then(roleChoices => {
    inquirer.prompt([
      {
        message: 'which employee to update?',
        type: 'list',
        choices: employeeChoices,
        name: 'employee_id'
      },
      {
        message: 'which role should they be?',
        type: 'list',
        choices: roleChoices,
        name: 'role_id'
      }
    ])
    .then(answer=> {
      const updatedRole = {
        role_id: answer.role_id
      }
      connection.query(`UPDATE employees SET ? WHERE id=${answer.employee_id}`, updatedRole, err => {
        if(err) {
          console.log(err)
        } else {
          console.log('employee updated'),
          start()
        }
      })
    })
    })
    })
}

function viewAllRoles() {
  connection.query("SELECT roles.title, roles.salary, departments.name AS department FROM roles JOIN departments ON departments.id = roles.department_id", function(err, results) {
    if(err) {
      console.log(err)
    } else {
      console.table(results)
      start()
    }
  })
}

function viewAllEmployees() {
  connection.query(
    "SELECT e.first_name, e.last_name, r.title, r.salary, m.first_name AS manager_first_name FROM employees e JOIN roles r ON e.role_id = r.id LEFT JOIN employees m ON e.manager_id = m.id;",
    function (err, results) {
      if (err) {
        console.log(err);
      } else {
        console.table(results);
        start();
      }
    }
  );
}


function viewAllDepartments() {
  connection.query("SELECT * FROM departments", function(err, results) {
    if(err) {
      console.log(err)
    } else {
      console.table(results)
      start()
    }
  })
}
   
function addADepartment() {
  inquirer
    .prompt([
      {
        message: "what is the name of the department?",
        type: "input",
        name: "department",
      },
    ])
    .then((answer) => {
      let departmentName = {
        name: answer.department,
      };
      connection.query("INSERT INTO departments SET ?", departmentName, err => {
        if(err){
          console.log(err)
        } else {
          console.log('department added.')
          start()
        }
      })
    });
}

function addARole() {
 getDepartmentChoices()
 .then(departmentChoices=> {
    inquirer
      .prompt([
        {
          message: "what is the name of the role?",
          type: "input",
          name: "title",
        },
        {
          message: "what is the salary of the role?",
          type: "input",
          name: "salary",
        },
        {
          message: "what department does this role belong to?",
          type: "list",
          choices: departmentChoices,
          name: "department_id",
        },
      ])
      .then((answer) => {
        connection.query("INSERT INTO ROLES SET ?", answer, (err) => {
          if (err) {
            console.log(err);
          } else {
            console.log("role added.");
            start();
          }
        });
      });
 })
}

function addAnEmployee() {
 
    getRoleChoices()
    .then(roleChoices => {
      inquirer.prompt([
        {
          message: "what is the employee's first name?",
          type: "input",
          name: "first_name",
        },
        {
          message: "what is the employee's last name?",
          type: "input",
          name: "last_name",
        },
        {
          message: "what is the role of the employee?",
          type: "list",
          choices: roleChoices,
          name: "role_id"
        },
        {
          message: "does the employee have a manager?",
          type: "list",
          choices: ["yes", "no"],
          name: "manager"
        }
      ])
      .then((answer) => {
        if(answer.manager === 'yes') {
          getEmployeeChoices()
          .then(employeeChoices=> {
            inquirer.prompt([
              {
                message: "who is the employee's manager?",
                type: "list",
                choices: employeeChoices,
                name: 'manager_id'
              }
            ])
            .then(newAnswer=> {
              const employee = {
                first_name: answer.first_name,
                last_name: answer.last_name,
                role_id: answer.role_id,
                manager_id: newAnswer.manager_id
              };
              connection.query("INSERT INTO employees SET ?", employee, (err) => {
              if (err) {
               console.log(err);
                 } else {
               console.log("employee added.");
               start();
              }
           });

            })
          })


        } else {
          const employee = {
            first_name: answer.first_name,
            last_name: answer.last_name,
            role_id: answer.role_id
          }
           connection.query("INSERT INTO employees SET ?", employee, (err) => {
             if (err) {
               console.log(err);
             } else {
               console.log("employee added.");
               start();
             }
           });
        }
      })
    })
}

function getEmployeeChoices() {
  return new Promise((resolve, reject) => {
    connection.query("SELECT * FROM employees", (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(
          res.map((employee) => {
            return {
              name: employee.first_name + " " + employee.last_name,
              value: employee.id,
            };
          })
        );
      }
    });
  });
}

function getRoleChoices() {
  return new Promise((resolve, reject) => {
    connection.query("SELECT * FROM roles", (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(
          res.map((role) => {
            return {
              name: role.title,
              value: role.id,
            };
          })
        );
      }
    });
  });
}

function getDepartmentChoices() {
  return new Promise((resolve, reject) => {
    connection.query("SELECT * FROM departments", (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(
          res.map((department) => {
            return {
              name: department.name,
              value: department.id,
            };
          })
        );
      }
    });
  });
}

start();
