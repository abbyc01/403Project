let express = require("express");
let app = express();
let path = require("path");

app.use(express.urlencoded({ extended: true }));

// -----> Connect Database here
const knex = require("knex")({
  client: "pg",
  connection: {
    host: "localhost",
    user: "postgres",
    password: "Jayfeather01",
    database: "403Project",
    port: 5432,
  },
});

// -----> Set Views (for HTML files) and Public (for CSS/pics)
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

// -----> put all routes below

// Main Page
app.get("/", (req, res) => res.render("index"));

// Login Page
app.get("/login", (req, res) => res.render("login", { error: null }));

// Login Form Submission
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await knex("Admins")
      .where({ username: username, password: password })
      .first();

    if (user) {
      res.redirect("/internal");
    } else {
      res.redirect("/");
    }
  } catch (error) {
    console.error("Error querying database:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Add Volunteer Loading and Posting
app.get("/addVolunteer", (req, res) => {
  knex("Referral")
    .select("ReferralID", "ReferralName")
    .then((Referral) => res.render("addVolunteer", { Referral }))
    .catch((error) => {
      console.error("Error fetching Referral:", error);
      res.status(500).send("Internal Server Error");
    });
});

app.post("/addEmployee", (req, res) => {
  const VolFirstName = req.body.VolFirstName.toUpperCase() || "";
  const VolLastName = req.body.VolLastName.toUpperCase() || "";
  const Phone = req.body.Phone || "";
  const Email = req.body.Email || "";
  const VolCity = req.body.VolCity.toUpperCase() || "";
  const VolCounty = req.body.VolCounty.toUpperCase() || "";
  const VolState = req.body.VolState.toUpperCase() || "";
  const ReferralID = parseInt(req.body.ReferralID);
  const SewingLevel = req.body.SewingLevel || "B";
  const HoursPerMonth = parseInt(req.body.HoursPerMonth) || null;

  knex("Volunteer")
    .insert({
      VolFirstName,
      VolLastName,
      Phone,
      Email,
      VolCity,
      VolCounty,
      VolState,
      ReferralID,
      SewingLevel,
      HoursPerMonth,
    })
    .then(() => res.redirect("/"))
    .catch((error) => {
      console.error("Error Adding Volunteer:", error);
      res.status(500).send("Internal Server Error");
    });
});

// -----> View Attendance
app.get("/viewAttendance", (req, res) => {
  knex("Employee_Attendance as ea")
    .join("Employees as e", "ea.EmployeeID", "e.EmployeeID")
    .join("Attendance as a", "ea.AttendanceID", "a.AttendanceID")
    .select(
      "ea.AttendanceID",
      "e.EmpFirstName",
      "e.EmpLastName",
      "ea.AttenDate",
      "ea.AttenPointValue",
      "a.AttenDescription"
    )
    .orderBy("ea.AttenDate", "desc")
    .then((attendanceData) => {
      res.render("viewAttendance", { attendanceData });
    })
    .catch((error) => {
      console.error("Error fetching attendance data:", error);
      res.status(500).send("Internal Server Error");
    });
});

// -----> Edit Attendance
app.get("/editAttendance/:AttendanceID", (req, res) => {
  const AttendanceID = req.params.AttendanceID;

  // Fetch the attendance record to edit
  knex("Employee_Attendance")
    .where("AttendanceID", AttendanceID)
    .first()
    .then((attendance) => {
      if (!attendance) {
        return res.status(404).send("Attendance not found");
      }

      // Fetch all attendance descriptions and their point values
      knex("Attendance")
        .select("AttenDescription", "AttendanceID")
        .then((descriptions) => {
          // Render the editAttendance view with both the attendance record and descriptions
          res.render("editAttendance", {
            attendance: attendance,
            descriptions: descriptions,
          });
        })
        .catch((error) => {
          console.error("Error fetching descriptions:", error);
          res.status(500).send("Error fetching descriptions");
        });
    })
    .catch((error) => {
      console.error("Error fetching attendance record:", error);
      res.status(500).send("Error fetching attendance record");
    });
});

app.post("/editAttendance/:AttendanceID", (req, res) => {
  const AttendanceID = req.params.AttendanceID;
  const { AttenDate, AttenPointValue, AttenDescription } = req.body;

  knex("Employee_Attendance")
    .where("AttendanceID", AttendanceID)
    .update({
      AttenDate,
      AttenPointValue,
      AttenDescription,
    })
    .then(() => res.redirect("/viewAttendance")) // Redirect to viewAttendance after successful update
    .catch((error) => {
      console.error("Error updating attendance:", error);
      res.status(500).send("Internal Server Error");
    });
});

// -----> Delete Attendance
app.post("/deleteAttendance/:AttendanceID", (req, res) => {
  const AttendanceID = req.params.AttendanceID;

  knex("Employee_Attendance")
    .where("AttendanceID", AttendanceID)
    .del()
    .then(() => res.redirect("/viewAttendance"))
    .catch((error) => {
      console.error("Error deleting attendance record:", error);
      res.status(500).send("Internal Server Error");
    });
});

// -----> View Certifications
app.get("/viewCertifications", (req, res) => {
  knex("Student_Certifications as sc")
    .join("Employees as e", "sc.EmployeeID", "e.EmployeeID")
    .join("Certifications as c", "sc.CertificationID", "c.CertificationID")
    .select(
      "e.EmpFirstName",
      "e.EmpLastName",
      "c.CertDescription",
      "sc.CertGrade"
    )
    .then((certificationsData) => {
      res.render("viewCertifications", { certificationsData });
    })
    .catch((error) => {
      console.error("Error fetching certifications data:", error);
      res.status(500).send("Internal Server Error");
    });
});
// -----> Add Certification
app.post("/addCertification", (req, res) => {
  const { EmployeeID, CertificationID, Grade, CertificationDate } = req.body;

  knex("Employee_Certifications")
    .insert({
      EmployeeID,
      CertificationID,
      Grade,
      CertificationDate,
    })
    .then(() => res.redirect("/viewCertifications")) // Redirect to viewCertifications after successful insert
    .catch((error) => {
      console.error("Error adding certification:", error);
      res.status(500).send("Internal Server Error");
    });
});

app.get("/editCertifications", (req, res) => {
  const { EmployeeID, CertificationID } = req.query;

  // Validate if the required parameters are present
  if (!EmployeeID || !CertificationID) {
    return res.status(400).send("Missing parameters");
  }

  // Fetch the required data from the three tables
  Promise.all([
    knex("Student_Certifications")
      .where("CertificationID", CertificationID)
      .where("EmployeeID", EmployeeID)
      .select("CertGrade"), // Certification grade from Student_Certifications
    knex("Employees")
      .where("EmployeeID", EmployeeID)
      .select("EmpFirstName", "EmpLastName"), // Employee name from Employees
    knex("Certifications")
      .where("CertificationID", CertificationID)
      .select("CertDescription"), // Certification description from Certifications
  ])
    .then(([certificationData, employeeData, certDescriptionData]) => {
      if (
        !certificationData.length ||
        !employeeData.length ||
        !certDescriptionData.length
      ) {
        return res
          .status(404)
          .send("Employee, Certification, or Description not found");
      }

      // Pass the data to the editCertifications page
      res.render("editCertifications", {
        Certification: certificationData[0],
        Employee: employeeData[0],
        CertDescription: certDescriptionData[0].CertDescription,
      });
    })
    .catch((err) => {
      console.error("Error fetching data:", err);
      res.status(500).send("Internal Server Error");
    });
});

// Handle POST request for editing certifications
app.post("/editCertifications", (req, res) => {
  const { EmployeeID, CertificationID } = req.body;

  // Fetch the data from the database
  Promise.all([
    knex("Student_Certifications")
      .where("CertificationID", CertificationID)
      .where("EmployeeID", EmployeeID)
      .select("CertGrade"),
    knex("Employees")
      .where("EmployeeID", EmployeeID)
      .select("EmpFirstName", "EmpLastName"),
    knex("Certifications")
      .where("CertificationID", CertificationID)
      .select("CertDescription"),
  ])
    .then(([certificationData, employeeData, certDescriptionData]) => {
      // Check if any data is missing
      if (
        !certificationData.length ||
        !employeeData.length ||
        !certDescriptionData.length
      ) {
        return res
          .status(404)
          .send("Employee, Certification, or Description not found");
      }

      // Render the edit page with the fetched data
      res.render("editCertifications", {
        Certification: certificationData[0],
        Employee: employeeData[0],
        CertDescription: certDescriptionData[0].CertDescription,
      });
    })
    .catch((err) => {
      console.error("Error fetching data:", err);
      res.status(500).send("Internal Server Error");
    });
});

// Route for internal page (after login)
app.get("/internal", (req, res) => {
  res.render("internal");
});

// Start the server
app.listen(3000, () => console.log("server started"));
