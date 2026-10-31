const Branch = require("../models/Branch");
const Place = require("../models/Place");
const Employee = require("../models/Employee");
const Article = require("../models/Article");
const Customer = require("../models/Customer");
const Driver = require("../models/Driver");
const Supplier = require("../models/Supplier");
const VehicleType = require("../models/VehicleType");
const Vehicle = require("../models/Vehicle");
const Bank = require("../models/Bank");
const BankAccount = require("../models/BankAccount");
const RateMaster = require("../models/RateMaster");
const TransactionPrefix = require("../models/TransactionPrefix");
const LorryReceipt = require("../models/LorryReceipt");
const pool = require('../database/db.js');
const { createPool } = require("mysql2");
const dayjs = require('dayjs');

// Add a branch
// const addBranch = (req, res, next) => {
//   const branch = new Branch({
//     abbreviation: req.body.abbreviation?.trim?.(),
//     branchCode: req.body.branchCode?.trim?.(),
//     description: req.body.description?.trim?.(),
//     name: req.body.name?.trim?.(),
//     place: req.body.place?.trim?.(),
//     printer: req.body.printer,
//     createdBy: req.body.createdBy,
//   });

//   Branch.find(
//     {
//       $or: [
//         { name: { $regex: getRegex(req.body.name?.trim?.()), $options: "i" } },
//         {
//           branchCode: {
//             $regex: getRegex(req.body.branchCode?.trim?.()),
//             $options: "i",
//           },
//         },
//         {
//           abbreviation: {
//             $regex: getRegex(req.body.abbreviation?.trim?.()),
//             $options: "i",
//           },
//         },
//       ],
//     },
//     "_id name branchCode abbreviation",
//     (error, foundBranches) => {
//       if (error) {
//         return next(error);
//       }
//       if (foundBranches && foundBranches.length > 0) {
//         let message = "";
//         for (const foundBranch of foundBranches) {
//           if (
//             foundBranch.branchCode?.toUpperCase() ===
//               branch.branchCode?.toUpperCase() &&
//             foundBranch.name?.toUpperCase() === branch.name?.toUpperCase()
//           ) {
//             message = `Branch with Branch code (${foundBranch.branchCode}) and Branch name (${foundBranch.name}) already exist!`;
//             break;
//           }
//           if (
//             foundBranch.branchCode?.toUpperCase() ===
//             branch.branchCode?.toUpperCase()
//           ) {
//             message = `Branch with Branch code (${foundBranch.branchCode}) already exist!`;
//             break;
//           }
//           if (foundBranch.name?.toUpperCase() === branch.name?.toUpperCase()) {
//             message = `Branch with Branch name (${foundBranch.name}) already exist!`;
//             break;
//           }

//           if (
//             foundBranch.abbreviation?.toUpperCase() ===
//             branch.abbreviation?.toUpperCase()
//           ) {
//             message = `Branch with Branch abbreviation (${foundBranch.abbreviation}) already exist!`;
//             break;
//           }
//         }
//         return res.status(200).json({
//           message: message,
//         });
//       }
//       Branch.create(branch, (error, data) => {
//         if (error) {
//           res.send(error);
//         } else {
//           res.send(data);
//         }
//       });
//     }
//   ).lean();
// };
const addBranch = async (req, res) => {
  const { branchCode, abbreviation, name, description, place, printer } = req.body;
  const query = 'CALL addbranch(?,?,?,?,?,?, @message)';
  try {
    await pool.query(query, [branchCode, abbreviation, name, description, place, printer]);
    const [results] = await pool.query('SELECT @message as message');
    res.json({ message: results[0].message });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Server error');
  }
};


// Get all branches (100 branches)
// const getBranches = (req, res, next) => {
//   Branch.find({ active: true })
//     .sort("-createdAt")
//     .exec((error, branches) => {
//       if (error) {
//         return res.status(200).json({
//           message: "Error fetching branches!",
//         });
//       } else {
//         res.json(branches);
//       }
//     });
// };
const getBranches = async (req, res) => {
  const query = 'CALL getallbranches()';

  try {
      const [results] = await pool.query(query);
      const branches = results[0];

      // Mapping the data to extract necessary fields
      const branchList = branches.map((branch) => ({
          branch_id: branch.branch_id,
          branch_name: branch.branch_name,
      }));

      return res.json(branchList);
  } catch (err) {
      console.error('Error:', err);
      return res.status(500).send('Server error');
  }
};


// Get all branches
const getBranchList = async (req, res) => {
  try {
    const query = 'CALL branchlist()';
    const [results] = await pool.query(query);
    const branchList = results[0];

    // Reverse the data and convert to uppercase
    const transformedBranchList = branchList
      .reverse()
      .map(item => {
        const upperCaseItem = {};
        for (const key in item) {
          if (typeof item[key] === 'string') {
            upperCaseItem[key] = item[key].toUpperCase();
          } else {
            upperCaseItem[key] = item[key];
          }
        }
        return upperCaseItem;
      });

    res.json(transformedBranchList);
  } catch (error) {
    console.error('Error executing stored procedure:', error);
    res.status(500).json({
      message: 'Error fetching branches!',
    });
  }
};


// Get a branch
// const getBranch = (req, res, next) => {
//   Branch.findById(req.params.id, (error, data) => {
//     if (error) {
//       res.json({ message: error.message });
//     } else {
//       res.json(data);
//     }
//   });
// };

const getBranch = async (req, res) => {
  const id = req.params.id;


  const query = 'CALL getbranchbyid(?)';

  try {
    const [results] = await pool.query(query, [id]);
    if (results[0].length === 0) {
      return res.status(404).send('Branch not found');
    }
    return res.json(results[0]);
  } catch (err) {
    console.error('Error executing query:', err);
    return res.status(500).send('Server error');
  }
};


// Remove a branch
// const removeBranch = (req, res, next) => {
//   if (!req.params.id) {
//     return res.status(200).json({ message: "Branch ID is required!" });
//   }

//   Branch.findByIdAndUpdate(
//     req.params.id,
//     {
//       $set: {
//         active: false,
//         updatedBy: req.body.updatedBy,
//       },
//     },
//     { new: true },
//     (error, data) => {
//       if (error) {
//         res.status(200).json({ message: error.message });
//       } else {
//         res.json({ id: data._id });
//       }
//     }
//   );
// };

const removeBranch = async (req, res) => {
  const id = req.params.id.toString();

  const query = 'CALL deletebranch(?, @message)';

  try {
    await pool.query(query, [id]);
    const [results] = await pool.query('SELECT @message as message');
    res.json({ message: results[0].message });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Server error');
  }
};


// Update a branch
// const updateBranch = (req, res, next) => {
//   const _id = req.body._id;

//   if (!req.params.id || !_id) {
//     return res.status(200).json({ message: "Branch ID is required!" });
//   }

//   Branch.find(
//     {
//       $or: [
//         { name: { $regex: getRegex(req.body.name?.trim?.()), $options: "i" } },
//         {
//           branchCode: {
//             $regex: getRegex(req.body.branchCode?.trim?.()),
//             $options: "i",
//           },
//         },
//         {
//           abbreviation: {
//             $regex: getRegex(req.body.abbreviation?.trim?.()),
//             $options: "i",
//           },
//         },
//       ],
//       _id: { $ne: _id },
//     },
//     (error, foundBranches) => {
//       if (error) {
//         return next(error);
//       }
//       if (foundBranches && foundBranches.length > 0) {
//         let message = "";
//         for (const foundBranch of foundBranches) {
//           if (
//             foundBranch.branchCode?.toUpperCase() ===
//               req.body.branchCode?.trim?.()?.toUpperCase() &&
//             foundBranch.name?.toUpperCase() ===
//               req.body.name?.trim?.()?.toUpperCase()
//           ) {
//             message = `Branch with Branch code (${foundBranch.branchCode}) and Branch name (${foundBranch.name}) already exist!`;
//             break;
//           }
//           if (
//             foundBranch.branchCode?.toUpperCase() ===
//             req.body.branchCode?.trim?.()?.toUpperCase()
//           ) {
//             message = `Branch with Branch code (${foundBranch.branchCode}) already exist!`;
//             break;
//           }
//           if (
//             foundBranch.name?.toUpperCase() ===
//             req.body.name?.trim?.()?.toUpperCase()
//           ) {
//             message = `Branch with Branch name (${foundBranch.name}) already exist!`;
//             break;
//           }
//           if (
//             foundBranch.abbreviation?.toUpperCase() ===
//             req.body.abbreviation?.trim?.()?.toUpperCase()
//           ) {
//             message = `Branch with Branch abbreviation (${foundBranch.abbreviation}) already exist!`;
//             break;
//           }
//         }
//         return res.status(200).json({
//           message: message,
//         });
//       }
//       Branch.findByIdAndUpdate(
//         _id,
//         {
//           $set: {
//             branchCode: req.body.branchCode?.trim?.(),
//             abbreviation: req.body.abbreviation?.trim?.(),
//             name: req.body.name?.trim?.(),
//             description: req.body.description?.trim?.(),
//             place: req.body.place?.trim?.(),
//             openingBalance: req.body.openingBalance,
//             balanceType: req.body.balanceType,
//             updatedBy: req.body.updatedBy,
//           },
//         },
//         { new: true },
//         (error, data) => {
//           if (error) {
//             res.status(200).json({ message: error.message });
//           } else {
//             res.json(data);
//           }
//         }
//       );
//     }
//   );
// };
const updateBranch = async (req, res) => {
  const { branchId, branchCode, abbreviation, name, description, place, printer } = req.body;

  const updateQuery = 'CALL updatebranch(?, ?, ?, ?, ?, ?, ?, @message)';
  const messageQuery = 'SELECT @message as message';

  try {
    await pool.query(updateQuery, [branchId, branchCode, abbreviation, name, description, place, printer]);
    const [rows] = await pool.query(messageQuery);
    res.json({ message: rows[0].message });

  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Server error');
  }
};

// Get places
// const getPlaces = (req, res, next) => {
//   Place.find({ active: true })
//     .lean()
//     .sort("-createdAt")
//     .exec((error, places) => {
//       if (error) {
//         return res.status(200).json({
//           message: "Error fetching places!",
//         });
//       } else {
//         res.json(places);
//       }
//     });
// };
const getPlaces = async (req, res, next) => {
  const query = 'CALL getallplaces()';

  try {
    const [results] = await pool.query(query);
    const places = results[0];

    // Reverse the data and convert to uppercase
    const transformedPlaces = places
      .reverse()
      .map(item => {
        const upperCaseItem = {};
        for (const key in item) {
          if (typeof item[key] === 'string') {
            upperCaseItem[key] = item[key].toUpperCase();
          } else {
            upperCaseItem[key] = item[key];
          }
        }
        return upperCaseItem;
      });

    res.json(transformedPlaces);
  } catch (error) {
    console.error('Error fetching places:', error);
    res.status(500).json({
      message: "Error fetching places!"
    });
  }
};


// Add a Place
// const addPlace = (req, res, next) => {
//   const place = new Place({
//     name: req.body.name?.trim?.(),
//     abbreviation: req.body.abbreviation?.trim?.(),
//     createdBy: req.body.createdBy,
//   });

//   Place.find(
//     {
//       $or: [
//         { name: { $regex: getRegex(req.body.name?.trim?.()), $options: "i" } },
//         {
//           abbreviation: {
//             $regex: getRegex(req.body.abbreviation?.trim?.()),
//             $options: "i",
//           },
//         },
//       ],
//       active: true,
//     },
//     (error, foundPlaces) => {
//       if (error) {
//         return next(error);
//       }
//       if (foundPlaces && foundPlaces.length > 0) {
//         let message = `Place with (${
//           req.body.name?.trim?.()?.toUpperCase() ===
//           foundPlaces.name?.trim()?.toUpperCase()
//             ? req.body.name
//             : req.body.abbreviation
//         } already exist!)`;
//         return res.status(200).json({
//           message: message,
//         });
//       }
//       Place.create(place, (error, data) => {
//         if (error) {
//           res.send(error);
//         } else {
//           res.send(data);
//         }
//       });
//     }
//   );
// };
const addPlace = async (req, res) => {
  const { name, abbreviation, contact } = req.body;

  // Trim and convert to uppercase
  const formattedName = name.trim().toUpperCase();
  const formattedAbbreviation = abbreviation.trim().toUpperCase();

  const callQuery = 'CALL addplace(?, ?, ?, @message)';

  try {
    await pool.query(callQuery, [formattedName, formattedAbbreviation, contact]);
    const [messageResults] = await pool.query('SELECT @message as message');
    res.json({ message: messageResults[0].message });

  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Server error');
  }
};





// Remove a place
// const removePlace = (req, res, next) => {
//   if (!req.params.id) {
//     return res.status(200).json({ message: "Place ID is required!" });
//   }

//   Place.findByIdAndUpdate(
//     req.params.id,
//     {
//       $set: {
//         active: false,
//         updatedBy: req.body.updatedBy,
//       },
//     },
//     { new: true },
//     (error, data) => {
//       if (error) {
//         res.status(200).json({ message: error.message });
//       } else {
//         res.json({ id: data._id });
//       }
//     }
//   );
// };
const removePlace = async (req, res) => {
  const id = req.params.id.toString();
  const query = 'CALL deleteplace(?, @message)';

  try {
    await pool.query(query, [id]);
    const [results] = await pool.query('SELECT @message as message');
    res.json({ message: results[0].message });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Server error');
  }
};

// Update a place
// const updatePlace = (req, res, next) => {
//   const _id = req.body._id;

//   if (!req.params.id || !_id) {
//     return res.status(200).json({ message: "Place ID is required!" });
//   }

//   Place.find(
//     {
//       $or: [
//         { name: { $regex: getRegex(req.body.name?.trim?.()), $options: "i" } },
//         {
//           abbreviation: {
//             $regex: getRegex(req.body.abbreviation?.trim?.()),
//             $options: "i",
//           },
//         },
//       ],
//       _id: { $ne: _id },
//       active: true,
//     },
//     (error, foundPlaces) => {
//       if (error) {
//         return next(error);
//       }
//       if (foundPlaces && foundPlaces.length > 0) {
//         let message = `Place with (${
//           req.body.name?.trim?.()?.toUpperCase() ===
//           foundPlaces.name?.trim()?.toUpperCase()
//             ? req.body.name
//             : req.body.abbreviation
//         } already exist!)`;
//         return res.status(200).json({
//           message: message,
//         });
//       }
//       Place.findByIdAndUpdate(
//         _id,
//         {
//           $set: {
//             name: req.body.name?.trim?.(),
//             abbreviation: req.body.abbreviation?.trim?.(),
//             updatedBy: req.body.updatedBy,
//           },
//         },
//         { new: true },
//         (error, data) => {
//           if (error) {
//             res.status(200).json({ message: error.message });
//           } else {
//             res.json(data);
//           }
//         }
//       );
//     }
//   );
// };
const updatePlace = async (req, res) => {
  const { placeId, name, abbreviation, contact } = req.body;

  // Trim and uppercase the name and abbreviation
  const formattedName = name ? name.toUpperCase().trim() : null;
  const formattedAbbreviation = abbreviation ? abbreviation.toUpperCase().trim() : null;

  const callQuery = 'CALL updateplace(?, ?, ?, ?, @message)';
  
  try {
    // Execute the stored procedure with the formatted values
    await pool.query(callQuery, [placeId, formattedName, formattedAbbreviation, contact]);

    // Fetch the OUT parameter message
    const [messageResults] = await pool.query('SELECT @message as message');
    
    // Return the message as a response
    return res.json({ message: messageResults[0].message });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};



// Get a place
// const getPlace = (req, res, next) => {
//   Place.findById(req.params.id, (error, data) => {
//     if (error) {
//       res.json({ message: error.message });
//     } else {
//       res.json(data);
//     }
//   });
// };
const getPlace = async (req, res) => {
  const id = req.params.id;
  const query = 'CALL getplacebyid(?)';

  try {
    const [results] = await pool.query(query, [id]);
    if (results.length > 0) {
      return res.json(results[0]);
    } else {
      return res.status(404).send('Place not found');
    }
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};


// Add a employee
// const addEmployee = (req, res, next) => {
//   const employee = new Employee({
//     code: req.body.code?.trim?.(),
//     name: req.body.name?.trim?.(),
//     telephone: req.body.telephone,
//     correspondenceAddress: req.body.correspondenceAddress?.trim?.(),
//     permanentAddress: req.body.permanentAddress?.trim?.(),
//     dateOfBirth: req.body.dateOfBirth,
//     mobile: req.body.mobile,
//     email: req.body.email?.trim?.(),
//     joiningDate: req.body.joiningDate,
//     qualification: req.body.qualification,
//     bloodGroup: req.body.bloodGroup,
//     designation: req.body.designation?.trim?.(),
//     createdBy: req.body.createdBy,
//   });

//   Employee.find(
//     {
//       $or: [
//         { telephone: req.body.telephone?.trim?.() },
//         { name: { $regex: getRegex(req.body.name?.trim?.()), $options: "i" } },
//       ],
//       active: true,
//     },
//     (error, foundEmp) => {
//       if (error) {
//         return next(error);
//       }
//       if (foundEmp && foundEmp.length > 0) {
//         let message = `Employee with telephone (${req.body.telephone}) or name (${req.body.name}) already exist!`;
//         return res.status(200).json({
//           message: message,
//         });
//       }
//       Employee.create(employee, (error, data) => {
//         if (error) {
//           if (error.code === 11000) {
//             return res.status(200).json({
//               message: `Employee with code (${req.body.code}) already exist!`,
//             });
//           }
//           res.send(error);
//         } else {
//           res.send(data);
//         }
//       });
//     }
//   );
// };
const addEmployee = async (req, res) => {
  const {
    name,
    correspondenceAddress,
    dateOfBirth,
    email,
    joiningDate,
    permanentAddress,
    qualification,
    mobile,
    bloodGroup,
    designation,
    branch
  } = req.body;
  const procedureQuery = `
      SET @message = '';
      CALL addemployee(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @message);
  `;

  const messageQuery = 'SELECT @message as message';

  try {
    await pool.query(procedureQuery, [
      name,
      correspondenceAddress,
      dateOfBirth,
      email,
      joiningDate,
      permanentAddress,
      qualification,
      mobile,
      bloodGroup,
      designation,
      branch
    ]);
    const [messageResults] = await pool.query(messageQuery);
    const message = messageResults[0].message;
    return res.json({ message });

  } catch (err) {
    console.error('Error executing query:', err);
    return res.status(500).send('Server error');
  }
};


// Get 100 employees
// const getEmployees = (req, res, next) => {
//   Employee.find({ active: true })
//     .lean()
//     .sort("-createdAt")
//     .exec((error, employees) => {
//       if (error) {
//         return res.status(200).json({
//           message: "Error fetching employees!",
//         });
//       } else {
//         res.json(employees);
//       }
//     });
// };

const getEmployees = async (req, res) => {
  const query = 'CALL getallemployee()';

  try {
    const [results] = await pool.query(query);
    const employees = results[0];
    console.log(employees);

    // Reverse the data, convert to uppercase, and format dates
    const transformedEmployees = employees.reverse().map(item => {
      const upperCaseItem = {};
      for (const key in item) {
        if (typeof item[key] === 'string') {
          // Format date fields
          if (key === 'date_of_birth' || key === 'joining_date') {
            upperCaseItem[key] = dayjs(item[key]).format('DD-MM-YYYY');
          } else {
            upperCaseItem[key] = item[key].toUpperCase();
          }
        } else {
          upperCaseItem[key] = item[key];
        }
      }
      return upperCaseItem;
    });

    return res.json(transformedEmployees);
  } catch (err) {
    console.error('Error executing query:', err);
    return res.status(500).send('Server error');
  }
};


// Remove a employee
// const removeEmployee = (req, res, next) => {
//   if (!req.params.id) {
//     return res.status(200).json({ message: "Employee ID is required!" });
//   }

//   Employee.findByIdAndUpdate(
//     req.params.id,
//     {
//       $set: {
//         active: false,
//         updatedBy: req.body.updatedBy,
//       },
//     },
//     { new: true },
//     (error, data) => {
//       if (error) {
//         res.status(200).json({ message: error.message });
//       } else {
//         res.json({ id: data._id });
//       }
//     }
//   );
// };

const removeEmployee = async (req, res) => {
  const id = req.params.id.toString();
  const query = 'CALL deleteemployee(?, @message)';
  try {
    await pool.query(query, [id]);
    const [results] = await pool.query('SELECT @message AS message');
    if (results.length > 0) {
      const { message } = results[0];
      return res.json({ message });
    } else {
      return res.status(404).json({ message: 'Employee not found or not deleted' });
    }
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};




// Update a employee
// const updateEmployee = (req, res, next) => {
//   const _id = req.body._id;

//   if (!req.params.id || !_id) {
//     return res.status(200).json({ message: "Employee ID is required!" });
//   }

//   Employee.find(
//     {
//       $or: [
//         { telephone: req.body.telephone?.trim?.() },
//         { name: { $regex: getRegex(req.body.name?.trim?.()), $options: "i" } },
//       ],
//       _id: { $ne: _id },
//       active: true,
//     },
//     (error, foundEmp) => {
//       if (error) {
//         return next(error);
//       }
//       if (foundEmp && foundEmp.length > 0) {
//         let message = `Employee with telephone (${req.body.telephone}) or name (${req.body.name}) already exist!`;
//         return res.status(200).json({
//           message: message,
//         });
//       }
//       Employee.findByIdAndUpdate(
//         _id,
//         {
//           $set: {
//             name: req.body.name?.trim?.(),
//             telephone: req.body.telephone,
//             correspondenceAddress: req.body.correspondenceAddress?.trim?.(),
//             permanentAddress: req.body.permanentAddress?.trim?.(),
//             dateOfBirth: req.body.dateOfBirth,
//             mobile: req.body.mobile,
//             email: req.body.email?.trim?.(),
//             joiningDate: req.body.joiningDate,
//             qualification: req.body.qualification,
//             bloodGroup: req.body.bloodGroup,
//             designation: req.body.designation?.trim?.(),
//             updatedBy: req.body.updatedBy,
//           },
//         },
//         { new: true },
//         (error, data) => {
//           if (error) {
//             res.status(200).json({ message: error.message });
//           } else {
//             res.json(data);
//           }
//         }
//       );
//     }
//   );
// };
const updateEmployee = async (req, res) => {
  const {
    id,
    name,
    correspondenceAddress,
    dateOfBirth,
    email,
    joiningDate,
    permanentAddress,
    qualification,
    mobile,
    bloodGroup,
    designation,
    branch
  } = req.body;

  const query = `
      SET @message = '';
      CALL updateemployee(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @message);
      SELECT @message AS message;
  `;

  try {
    const [result] = await pool.query(query, [
      id,
      name,
      correspondenceAddress,
      dateOfBirth,
      mobile,
      email,
      joiningDate,
      permanentAddress,
      qualification,
      mobile,
      bloodGroup,
      designation,
      branch
    ]);
    const message = result[2][0].message;
    return res.json({ message });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};



// Get a employee
// const getEmployee = (req, res, next) => {
//   Employee.findById(req.params.id, (error, data) => {
//     if (error) {
//       res.json({ message: error.message });
//     } else {
//       res.json(data);
//     }
//   });
// };

const getEmployee = async (req, res) => {
  const id = req.params.id.toString();
  const query = 'CALL getemployeebyid(?)';
  try {
    const [results] = await pool.query(query, [id]);
    return res.json(results[0]);
  } catch (err) {
    console.error('Error executing query:', err);
    return res.status(500).send('Server error');
  }
};


// Get articles
// const getArticles = (req, res, next) => {
//   Article.find({ active: true })
//     .sort("-createdAt")
//     .exec((error, articles) => {
//       if (error) {
//         return res.status(200).json({
//           message: "Error fetching articles!",
//         });
//       } else {
//         res.json(articles);
//       }
//     });
// };
const getArticles = async (req, res) => {
  const query = 'CALL getallarticles()';

  try {
    const [results] = await pool.query(query);
    const articles = results[0];

    // Reverse the data and convert to uppercase
    const transformedArticles = articles
      .reverse()
      .map(item => {
        const upperCaseItem = {};
        for (const key in item) {
          if (typeof item[key] === 'string') {
            upperCaseItem[key] = item[key].toUpperCase();
          } else {
            upperCaseItem[key] = item[key];
          }
        }
        return upperCaseItem;
      });

    return res.json(transformedArticles);
  } catch (err) {
    console.error('Error executing query:', err);
    return res.status(500).send('Server error');
  }
};



// Get a article
// const getArticle = (req, res, next) => {
//   Article.findById(req.params.id, (error, data) => {
//     if (error) {
//       res.json({ message: error.message });
//     } else {
//       res.json(data);
//     }
//   });
// };
const getArticle = async (req, res) => {
  const id = req.params.id;
  const query = 'CALL getarticlebyid(?)';
  try {
    const [results] = await pool.query(query, [id]);
    res.json(results[0]);
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Server error');
  }
};


// Add a article
// const addArticle = (req, res, next) => {
//   const article = new Article({
//     name: req.body.name?.toUpperCase()?.trim?.(),
//     description: req.body.description?.trim?.(),
//     createdBy: req.body.createdBy,
//   });

//   Article.find(
//     {
//       name: { $regex: getRegex(req.body.name?.trim?.()), $options: "i" },
//       active: true,
//     },
//     (error, foundArticles) => {
//       if (error) {
//         return next(error);
//       }
//       if (foundArticles && foundArticles.length > 0) {
//         let message = `Articles with (${req.body.name} already exist!)`;
//         return res.status(200).json({
//           message: message,
//         });
//       }
//       Article.create(article, (error, data) => {
//         if (error) {
//           if (error.code === 11000) {
//             return res.status(200).json({
//               message: `Article with name (${req.body.name}) already exist!`,
//             });
//           }
//           res.send(error);
//         } else {
//           res.send(data);
//         }
//       });
//     }
//   );
// };
const addArticle = async (req, res) => {
  const { name, description, rateType } = req.body; 
  if (!name) {
    return res.status(200).json({ message: 'Missing required field: Name' });
  }
  if (!rateType) {
    return res.status(200).json({ message: 'Missing required field: RateType' });
  }


  const callQuery = 'CALL addarticle(?, ?, ?, @message)'; 

  try {

    await pool.query(callQuery, [name, description, rateType]);
    const [messageResults] = await pool.query('SELECT @message as message');
    return res.json({ message: messageResults[0].message });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};


// Remove a article
// const removeArticle = (req, res, next) => {
//   if (!req.params.id) {
//     return res.status(200).json({ message: "Article ID is required!" });
//   }
//   Article.findByIdAndUpdate(
//     req.params.id,
//     {
//       $set: {
//         active: false,
//         updatedBy: req.body.updatedBy,
//       },
//     },
//     { new: true },
//     (error, data) => {
//       if (error) {
//         res.status(200).json({ message: error.message });
//       } else {
//         res.json({ id: data._id });
//       }
//     }
//   );
// };
const removeArticle = async (req, res) => {
  const id = req.params.id.toString();
  const query = 'CALL deletearticles(?, @message)';
  try {
    await pool.query(query, [`(${id})`]);
    const [results] = await pool.query('SELECT @message as message');
    res.json({ message: results[0].message });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).send('Server error');
  }
};






// Update a place
// const updateArticle = (req, res, next) => {
//   const _id = req.body._id;

//   if (!req.params.id || !_id) {
//     return res.status(200).json({ message: "Article ID is required!" });
//   }

//   Article.find(
//     {
//       name: { $regex: getRegex(req.body.name?.trim?.()), $options: "i" },
//       _id: { $ne: _id },
//       active: true,
//     },
//     (error, foundArticles) => {
//       if (error) {
//         return next(error);
//       }
//       if (foundArticles && foundArticles.length > 0) {
//         let message = `Articles with (${req.body.name} already exist!)`;
//         return res.status(200).json({
//           message: message,
//         });
//       }
//       Article.findByIdAndUpdate(
//         _id,
//         {
//           $set: {
//             branch: req.body.branch?.trim?.(),
//             name: req.body.name?.toUpperCase()?.trim?.(),
//             description: req.body.description?.trim?.(),
//             updatedBy: req.body.updatedBy,
//           },
//         },
//         { new: true },
//         (error, data) => {
//           if (error) {
//             res.status(200).json({ message: error.message });
//           } else {
//             res.json(data);
//           }
//         }
//       );
//     }
//   );
// };

const updateArticle = async (req, res) => {
  const { articleId, name, description, rateType } = req.body; 
  if (!articleId) {
    return res.status(200).json({ message: 'Missing required field: articleId' });
  }
  if (!name) {
    return res.status(200).json({ message: 'Missing required field: Name' });
  }
  if (!rateType) {
    return res.status(200).json({ message: 'Missing required field: RateType' });
  }
  const callQuery = 'CALL updatearticles(?, ?, ?, ?, @message)'; 
  const selectMessageQuery = 'SELECT @message AS message';
  try {
    await pool.query(callQuery, [articleId, name, description, rateType]);
    const [results] = await pool.query(selectMessageQuery);
    const message = results[0]?.message || 'No message returned from stored procedure';
    return res.json({ message });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};



// Get customers
const getCustomers = async (req, res, next) => {
  try {
    const search = res.body;
    const param = { active: true };
    if (search) {
      param.name = { $regex: new RegExp(search?.trim?.()), $options: "i" };
    }
    const customers = await Customer.find(param)
      .select("name _id address city telephone email") // Only select necessary fields
      .lean();
    res.json(customers);
  } catch (error) {
    res.status(200).json({
      message: "Error fetching customers!",
      error: error.message,
    });
  }
};

// Get customers
// const getCustomersForDrop = async (req, res, next) => {
//   try {
//     const pageSize = 100; // Adjust this based on your requirements
//     const search = req.body.search;
//     const param = { active: true };
//     let sort = [];
//     if (search) {
//       param.name = { $regex: new RegExp(search?.trim?.()), $options: "i" };
//       sort = [{ $sort: { name: 1 } }];
//     }
//     // const customers = await Customer.find(param)
//     //   .limit(pageSize)
//     //   .select("name _id address city telephone email") // Only select necessary fields
//     //   .lean();

//     const customers = await Customer.aggregate([
//       {
//         $addFields: {
//           cityId: {
//             $cond: {
//               if: {
//                 $ne: ["$city", null],
//               },
//               then: { $toObjectId: "$city" },
//               else: "$city",
//             },
//           },
//         },
//       },
//       {
//         $lookup: {
//           from: "place",
//           localField: "cityId",
//           foreignField: "_id",
//           as: "cityObj",
//         },
//       },
//       { $unwind: { path: "$cityObj", preserveNullAndEmptyArrays: true } },
//       {
//         $addFields: {
//           city: "$cityObj.name",
//         },
//       },
//       { $match: param },
//       { $limit: pageSize },
//       ...sort,
//       {
//         $project: {
//           _id: 1,
//           city: 1,
//           cityId: 1,
//           address: 1,
//           telephone: 1,
//           name: 1,
//           email: 1,
//         },
//       },
//     ]);
//     res.json(customers);
//   } catch (error) {
//     res.status(200).json({
//       message: "Error fetching customers!",
//       error: error.message,
//     });
//   }
// };
const getCustomersForDrop = async (req, res) => {
  const query = 'CALL viewallcustomer()';

  try {
      const [results] = await pool.query(query);
      
      const customers = results[0].map(customer => ({
          customer_id: customer.customer_id,
          customer_name: customer.customer_name,
          address: customer.address, 
          telephoneno: customer.telephoneno,
          city: customer.city,
          LRCharge: customer.LRCharges ,
          showHamali:customer.showHamali,
          emailid:customer.emailid
      }));

      return res.json(customers);
  } catch (err) {
      console.error('Error executing query:', err);
      return res.status(500).send('Server error');
  }
};



const getClientConsigneeForDrop = async (req, res) => {
  const query = 'CALL view_consignees_for_user(?)';  
  const { search } = req.body || req.query;
  if (!search) {
    return res.status(400).send('User ID is required');
  }
  try {
    const [results] = await pool.query(query, [search]);
    const customers = results[0].map(customer => ({
      customer_id: customer.customer_id,
      customer_name: customer.customer_name,
      address: customer.address,
      telephoneno: customer.telephoneno,
      city: customer.city,
      showHamali:customer.showHamali
    }));
    return res.json(customers);
  } catch (err) {
    console.error('Error executing query:', err);
    return res.status(500).send('Server error');
  }
};

const getClientConsignorsForDrop = async (req, res) => {
  const query = 'CALL view_consignors_for_user(?)';  
  const { search } = req.body || req.query;
  if (!search) {
    return res.status(400).send('User ID is required');
  }
  try {
    const [results] = await pool.query(query, [search]);
    const customers = results[0].map(customer => ({
      customer_id: customer.customer_id,
      customer_name: customer.customer_name,
      address: customer.address,
      telephoneno: customer.telephoneno,
      city: customer.city,
    }));
    
    return res.json(customers);
  } catch (err) {
    console.error('Error executing query:', err);
    return res.status(500).send('Server error');
  }
};



// Get customers
// const getCustomersWithPagination = async (req, res, next) => {
//   try {
//     const { pagination, search, searchType } = req.body;
//     const { page = 1, limit = 100 } = pagination || {};
//     const start = (page - 1) * limit;
//     const param = { active: true };
//     if (search) {
//       const searchText = new RegExp(search);
//       if (!searchType) {
//         param["$or"] = [
//           { name: { $regex: searchText, $options: "i" } },
//           { address: { $regex: searchText, $options: "i" } },
//           { email: { $regex: searchText, $options: "i" } },
//           { city: { $regex: searchText, $options: "i" } },
//           { telephone: { $regex: searchText, $options: "i" } },
//         ];
//       } else {
//         param[searchType] = { $regex: searchText, $options: "i" };
//       }
//     }

//     const customers = await Customer.aggregate([
//       { $sort: { createdAt: -1 } },
//       {
//         $addFields: {
//           cityId: {
//             $cond: {
//               if: {
//                 $ne: ["$city", null],
//               },
//               then: { $toObjectId: "$city" },
//               else: "$city",
//             },
//           },
//         },
//       },
//       {
//         $lookup: {
//           from: "place",
//           localField: "cityId",
//           foreignField: "_id",
//           as: "cityObj",
//         },
//       },
//       { $unwind: { path: "$cityObj", preserveNullAndEmptyArrays: true } },
//       {
//         $addFields: {
//           city: "$cityObj.name",
//         },
//       },
//       { $match: param },
//       { $skip: start },
//       { $limit: limit },
//       {
//         $project: {
//           _id: 1,
//           city: 1,
//           address: 1,
//           telephone: 1,
//           name: 1,
//           email: 1,
//         },
//       },
//     ]);

//     const count = await Customer.countDocuments(param);
//     res.json({
//       customers,
//       count: customers?.length > count ? customers?.length : count,
//     });
//   } catch (error) {
//     res.status(200).json({
//       message: "Error fetching customers!",
//       error: error.message,
//     });
//   }
// };
const getCustomersWithPagination = async (req, res) => {
  const { pagination, search, searchType } = req.body;
  const page = parseInt(pagination.page) || 0;
  const pageSize = parseInt(pagination.limit) || 10;
  const offset = page * pageSize;
  const trimmedSearch = search ? search.trim() : '';
  const customerQuery = 'CALL viewallcustomer()';
  const contactPersonQuery = 'SELECT person_name FROM contact_person_details WHERE customer_id = ?';

  try {
    const [customerResults] = await pool.query(customerQuery);
    let customers = customerResults[0];

    if (trimmedSearch) {
      customers = customers.filter(customer => {
        const searchLower = trimmedSearch.toLowerCase();
        if (!searchType) {
          return (customer.city && customer.city.toLowerCase().includes(searchLower)) ||
            (customer.customer_name && customer.customer_name.toLowerCase().includes(searchLower)) ||
            (customer.address && customer.address.toLowerCase().includes(searchLower)) ||
            (customer.emailid && customer.emailid.toLowerCase().includes(searchLower)) ||
            (customer.telephoneno && customer.telephoneno.toLowerCase().includes(searchLower)) ||
            (customer.vendor_code && customer.vendor_code.toLowerCase().includes(searchLower));
        }

        switch (searchType) {
          case 'city':
            return customer.city && customer.city.toLowerCase().includes(searchLower);
          case 'name':
            return customer.customer_name && customer.customer_name.toLowerCase().includes(searchLower);
          case 'address':
            return customer.address && customer.address.toLowerCase().includes(searchLower);
          case 'email':
            return customer.emailid && customer.emailid.toLowerCase().includes(searchLower);
          case 'telephone':
            return customer.telephoneno && customer.telephoneno.toLowerCase().includes(searchLower);
          case 'vendor_code':
            return customer.vendor_code && customer.vendor_code.toLowerCase().includes(searchLower);
          default:
            return false; // No matches if the searchType is unknown
        }
      });
    }

    customers.reverse();
    const total = customers.length;
    const paginatedCustomers = customers.slice(offset, offset + pageSize);

    const customerPromises = paginatedCustomers.map(async (customer) => {
      const [contactPersonResults] = await pool.query(contactPersonQuery, [customer.customer_id]);
      customer.contact_person_details = contactPersonResults.map(cp => cp.person_name.toUpperCase());
      return Object.fromEntries(
        Object.entries(customer).map(([key, value]) => [
          key,
          typeof value === 'string' ? value.toUpperCase() : value
        ])
      );
    });

    const paginatedCustomersWithContact = await Promise.all(customerPromises);

    return res.json({
      customers: paginatedCustomersWithContact,
      count: total
    });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};








const getCustomersByBranch = (req, res, next) => {
  if (!req.body.branchId) {
    return res.status(200).json({ message: "Branch ID is required" });
  }

  Customer.find({
    branch: req.body.branchId,
    active: true,
  }).exec((error, customers) => {
    if (error) {
      return res.status(200).json({
        message: "Error fetching customers!",
      });
    } else {
      res.json(customers);
    }
  });
};

// Get a customer
// const getCustomer = async (req, res, next) => {
//   try {
//     const data = await Customer.findById(req.params.id).lean();
//     const city = await Place.findById(data.city).lean();
//     res.json({ ...(data || {}), city });
//   } catch (error) {
//     res.json({ message: error.message });
//   }
// };
const getCustomer = async (req, res) => {
  const id = req.params.id;

  const queryCustomer = 'CALL findcustomerbyid(?)';
  const queryContact = 'CALL findcustomercontactperbyid(?)';

  try {
    const [customerResults] = await pool.query(queryCustomer, [id]);
    const customerData = customerResults[0]; 

    const [contactResults] = await pool.query(queryContact, [id]);
    const contactData = contactResults; 

    const combinedResults = {
      customer: customerData,
      contacts: contactData 
    };

    return res.json(combinedResults);
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};


// Add a customer
// const addCustomer = (req, res, next) => {
//   const customer = new Customer({
//     name: req.body.name
//       ? req.body.name?.toUpperCase()?.trim?.()
//       : req.body.name,
//     address: req.body.address?.trim?.(),
//     telephone: req.body.telephone,
//     alternateTelephone: req.body.alternateTelephone,
//     fax: req.body.fax,
//     cstNo: req.body.cstNo,
//     gstNo: req.body.gstNo,
//     state: req.body.state?.trim?.(),
//     city: req.body.city?.trim?.(),
//     email: req.body.email?.trim?.(),
//     vendorCode: req.body.vendorCode,
//     vatNo: req.body.vatNo,
//     eccNo: req.body.eccNo,
//     contactPerson: req.body.contactPerson,
//     createdBy: req.body.createdBy,
//   });

//   Customer.find(
//     {
//       name: { $regex: getRegex(req.body.name?.trim?.()), $options: "i" },
//       active: true,
//     },
//     (error, foundCustomer) => {
//       if (error) {
//         return next(error);
//       }
//       if (foundCustomer && foundCustomer.length > 0) {
//         let message = `Customer with name (${req.body.name}) already exist!`;
//         return res.status(200).json({
//           message: message,
//         });
//       }
//       Customer.create(customer, (error, data) => {
//         if (error) {
//           if (error.code === 11000) {
//             return res.status(200).json({
//               message: `Customer with name (${req.body.name}) already exist!`,
//             });
//           }
//           res.send(error);
//         } else {
//           res.send(data);
//         }
//       });
//     }
//   );
// };
const addCustomer = async (req, res, next) => {
  
  const {
    name,
    address,
    telephone,
    fax,
    gstNo,
    state,
    email,
    vendorCode,
    cstNo,
    vatNo,
    eccNo,
    contactPerson,
    city,
    branch = null,
    showHamali
  } = req.body;

  const sql = `CALL addcustomer(?, ?, ?, ?, ?, ?, ?, ?, @message, @inserted_id, ?, ?, ?, ?, ?,?)`;

  try {
    // Execute the stored procedure to add the customer
    await pool.query(sql, [
      name ? name.toUpperCase().trim() : null, // 1
      address?.trim(),                          // 2
      telephone,                                // 3
      fax || null,                                      // 4
      gstNo,                                    // 5
      city ? city.toUpperCase().trim() : null,                                  // 6
      email?.trim(),                            // 7
      vendorCode || null,                               // 8
      branch,                                   // 9
      state?.trim(),                            // 10
      cstNo || null,                                    // 11
      vatNo || null,                                    // 12
      eccNo || null,
      showHamali                                     // 13
    ]);

    // Fetch the OUT parameters
    const [result] = await pool.query("SELECT @message AS message, @inserted_id AS inserted_id");
    const { message, inserted_id } = result[0];

    if (message.includes('Customer Already Exists!')) {
      return res.status(200).json({ message });
    }

    // Insert each contact person
    for (const cp of contactPerson) {
      await pool.query(`INSERT INTO contact_person_details (customer_id, person_name, address, designation, emailid, faxno) VALUES(?, ?, ?, ?, ?, ?)`, [
        inserted_id,
        cp.name,
        cp.address?.trim(),
        cp.designation,
        cp.email,
        cp.phone
      ]);
    }

    res.status(201).json({
      message,
      insertedId: inserted_id,
    });
  } catch (error) {
    console.error("Error adding customer:", error);
    return next(error);
  }
};








// Update a customer
// const updateCustomer = (req, res, next) => {
//   const _id = req.body._id;
//   if (!req.params.id || !_id) {
//     return res.status(200).json({ message: "Customer ID is required!" });
//   }

//   Customer.find(
//     {
//       name: { $regex: getRegex(req.body.name?.trim?.()), $options: "i" },
//       _id: { $ne: _id },
//       active: true,
//     },
//     (error, foundCustomer) => {
//       if (error) {
//         return next(error);
//       }
//       if (foundCustomer && foundCustomer.length > 0) {
//         let message = `Customer with name (${req.body.name}) already exist!`;
//         return res.status(200).json({
//           message: message,
//         });
//       }
//       Customer.findByIdAndUpdate(
//         _id,
//         {
//           $set: {
//             name: req.body.name
//               ? req.body.name?.toUpperCase()?.trim?.()
//               : req.body.name,
//             address: req.body.address?.trim?.(),
//             telephone: req.body.telephone,
//             alternateTelephone: req.body.alternateTelephone,
//             fax: req.body.fax,
//             cstNo: req.body.cstNo,
//             gstNo: req.body.gstNo,
//             state: req.body.state?.trim?.(),
//             city: req.body.city?.trim?.(),
//             email: req.body.email?.trim?.(),
//             vendorCode: req.body.vendorCode,
//             vatNo: req.body.vatNo,
//             eccNo: req.body.eccNo,
//             contactPerson: req.body.contactPerson,
//             updatedBy: req.body.updatedBy,
//           },
//         },
//         { new: true },
//         (error, data) => {
//           if (error) {
//             res.status(200).json({ message: error.message });
//           } else {
//             res.json(data);
//           }
//         }
//       );
//     }
//   );
// };
const updateCustomer = async (req, res) => {
  console.log(req.body)
  const { id } = req.params;
  const {
    name,
    address,
    telephone,
    fax,
    gstNo,
    city,
    email,
    vendorCode,
    cp_person_name,
    cp_address,
    cp_designation,
    cp_emailid,
    cp_faxno,
    state,
    cstNo,
    vatNo,
    eccNo,
    branch,
    contactPerson,
    showHamali
  } = req.body;
console.log("showHamali",showHamali)
  const customerQuery = `
      CALL updatecustomer(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @message, ?, ?, ?, ?,?);
  `;

  try {
    const [results] = await pool.query(customerQuery, [
      id,
      name,
      address,
      telephone,
      fax,
      gstNo,
      city,
      email,
      vendorCode,
      id, 
      cp_person_name,
      cp_address,
      cp_designation,
      cp_emailid,
      cp_faxno,
      state,
      cstNo,
      vatNo,
      eccNo,
    
      showHamali
    ]);



    // Insert contact persons
    for (const contactperson of contactPerson) {
      const contactPersonQuery = `
          INSERT INTO contact_person_details (customer_id, person_name, address, designation, emailid, faxno) 
          VALUES (?, ?, ?, ?, ?, ?);
      `;
      await pool.query(contactPersonQuery, [
        id,
        contactperson.name,
        contactperson.address,
        contactperson.designation,
        contactperson.email,
        contactperson.phone,
      ]);
    }

    // Retrieve the output message from the stored procedure
    const [[messageResult]] = await pool.query('SELECT @message AS message');
    return res.json({ message: messageResult.message, results });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};


// Remove a customer
// const removeCustomer = (req, res, next) => {
//   if (!req.params.id) {
//     return res.status(200).json({ message: "Customer ID is required!" });
//   }

//   // Customer.findByIdAndUpdate(
//   //   req.params.id,
//   //   {
//   //     $set: {
//   //       active: false,
//   //       updatedBy: req.body.updatedBy
//   //     }
//   //   },
//   //   { new: true },
//   //   (error, data) => {
//   //     if (error) {
//   //       res.status(200).json({ message: error.message });
//   //     } else {
//   //       res.json({ id: data._id });
//   //     }
//   //   });
//   Customer.findByIdAndRemove(req.params.id, (error, data) => {
//     if (error) {
//       res.status(200).json({ message: error.message });
//     } else {
//       res.json({ id: data._id });
//     }
//   });
// };
const removeCustomer = async (req, res) => {
  const id = req.params.id;

  const query = 'CALL deletecustomer(?, @message)';

  try {
    await pool.query(query, [id]);
    const [messageResults] = await pool.query('SELECT @message AS message');
    const { message } = messageResults[0];
    return res.json({ message });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};


// Get drivers
// const getDrivers = (req, res, next) => {
//   Driver.find({ active: true })
//     .sort("-createdAt")
//     .exec((error, drivers) => {
//       if (error) {
//         return res.status(200).json({
//           message: "Error fetching drivers!",
//         });
//       } else {
//         res.json(drivers);
//       }
//     });
// };
const getDrivers = async (req, res) => {
  const query = 'CALL getalldrivers()';

  try {
    const [results] = await pool.query(query); // Use await for query
    const drivers = results[0]; // Assuming results[0] contains the data

    // Reverse the data and convert to uppercase
    const transformedDrivers = drivers
      .reverse()
      .map(item => {
        const upperCaseItem = {};
        for (const key in item) {
          if (typeof item[key] === 'string') {
            upperCaseItem[key] = item[key].toUpperCase();
          } else {
            upperCaseItem[key] = item[key];
          }
        }
        return upperCaseItem;
      });

    return res.json(transformedDrivers); // Return transformed data
  } catch (err) {
    console.error('Error executing query:', err);
    return res.status(500).send('Server error');
  }
};




// Get a driver
// const getDriver = (req, res, next) => {
//   Driver.findById(req.params.id, (error, data) => {
//     if (error) {
//       res.json({ message: error.message });
//     } else {
//       res.json(data);
//     }
//   });
// };
const getDriver = async (req, res) => {
  const id = req.params.id;

  const query = 'CALL getdriverbyid(?)';

  try {
    const [results] = await pool.query(query, [id]);

    if (results[0].length === 0) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    return res.json(results[0]);
  } catch (err) {
    console.error('Error executing query:', err);
    return res.status(500).send('Server error');
  }
};


// Add a driver
// const addDriver = (req, res, next) => {
//   const driver = new Driver({
//     code: req.body.code?.trim?.(),
//     name: req.body.name?.trim?.(),
//     correspondenceAddress: req.body.correspondenceAddress?.trim?.(),
//     permanentAddress: req.body.permanentAddress?.trim?.(),
//     dateOfBirth: req.body.dateOfBirth,
//     telephone: req.body.telephone,
//     mobile: req.body.mobile,
//     fatherName: req.body.fatherName?.trim?.(),
//     referencedBy: req.body.referencedBy,
//     eyeSight: req.body.eyeSight,
//     licenseNo: req.body.licenseNo,
//     licenseType: req.body.licenseType,
//     qualification: req.body.qualification,
//     joiningDate: req.body.joiningDate,
//     bloodGroup: req.body.bloodGroup,
//     renewDate: req.body.renewDate,
//     expiryDate: req.body.expiryDate,
//     remark: req.body.remark?.trim?.(),
//     createdBy: req.body.createdBy,
//   });

//   Driver.find(
//     { telephone: req.body.telephone?.trim?.(), active: true },
//     (error, foundDrivers) => {
//       if (error) {
//         return next(error);
//       }
//       if (foundDrivers && foundDrivers.length > 0) {
//         let message = `Driver with telephone no (${req.body.telephone} already exist!)`;
//         return res.status(200).json({
//           message: message,
//         });
//       }
//       Driver.create(driver, (error, data) => {
//         if (error) {
//           if (error.code === 11000) {
//             return res.status(200).json({
//               message: `Driver with (${req.body.code}) already exist!`,
//             });
//           }
//           res.send(error);
//         } else {
//           res.send(data);
//         }
//       });
//     }
//   );
// };

const addDriver = async (req, res) => {
  const {
    name,
    correspondenceAddress,
    dateOfBirth,
    telephone,
    fatherName,
    referencedBy,
    eyeSight,
    licenseNo,
    licenseType,
    remark,
    permanentAddress,
    qualification,
    mobile,
    joiningDate,
    bloodGroup,
    renewDate,
    expiryDate,
    branch
  } = req.body;
  const query = `
      SET @message = '';
      CALL adddriver(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @message);
      SELECT @message AS message;
  `;

  try {
    const [results] = await pool.query(query, [
      name,
      correspondenceAddress,
      dateOfBirth,
      telephone,
      fatherName,
      referencedBy,
      eyeSight,
      licenseNo,
      licenseType,
      remark,
      permanentAddress,
      qualification,
      mobile,
      joiningDate,
      bloodGroup,
      renewDate,
      expiryDate,
      branch
    ]);
    const message = results[1][0].message;
    return res.json({ message });
  } catch (err) {
    console.error('Error executing query:', err);
    return res.status(500).send('Server error');
  }
};



// Remove a driver
// const removeDriver = (req, res, next) => {
//   if (!req.params.id) {
//     return res.status(200).json({ message: "Driver ID is required!" });
//   }

//   Driver.findByIdAndUpdate(
//     req.params.id,
//     {
//       $set: {
//         active: false,
//         updatedBy: req.body.updatedBy,
//       },
//     },
//     { new: true },
//     (error, data) => {
//       if (error) {
//         res.status(200).json({ message: error.message });
//       } else {
//         res.json({ id: data._id });
//       }
//     }
//   );
// };
const removeDriver = async (req, res) => {
  const id = req.params.id.toString();

  const query = 'CALL deletedriver(?, @message)';
  try {
    await pool.query(query, [id]);
    const [results] = await pool.query('SELECT @message as message');

    return res.json({ message: results[0].message });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};

// Update a driver
// const updateDriver = (req, res, next) => {
//   const _id = req.body._id;

//   if (!req.params.id || !_id) {
//     return res.status(200).json({ message: "Driver ID is required!" });
//   }
//   Driver.find(
//     {
//       telephone: req.body.telephone?.trim?.(),
//       _id: { $ne: _id },
//       active: true,
//     },
//     (error, foundDrivers) => {
//       if (error) {
//         return next(error);
//       }
//       if (foundDrivers && foundDrivers.length > 0) {
//         let message = `Driver with telephone no (${req.body.telephone} already exist!)`;
//         return res.status(200).json({
//           message: message,
//         });
//       }
//       Driver.findByIdAndUpdate(
//         _id,
//         {
//           $set: {
//             name: req.body.name?.trim?.(),
//             correspondenceAddress: req.body.correspondenceAddress?.trim?.(),
//             permanentAddress: req.body.permanentAddress?.trim?.(),
//             dateOfBirth: req.body.dateOfBirth,
//             telephone: req.body.telephone,
//             mobile: req.body.mobile,
//             fatherName: req.body.fatherName?.trim?.(),
//             referencedBy: req.body.referencedBy?.trim?.(),
//             eyeSight: req.body.eyeSight,
//             licenseNo: req.body.licenseNo?.trim?.(),
//             licenseType: req.body.licenseType,
//             qualification: req.body.qualification?.trim?.(),
//             joiningDate: req.body.joiningDate,
//             bloodGroup: req.body.bloodGroup,
//             renewDate: req.body.renewDate,
//             expiryDate: req.body.expiryDate,
//             remark: req.body.remark?.trim?.(),
//             updatedBy: req.body.updatedBy,
//           },
//         },
//         { new: true },
//         (error, data) => {
//           if (error) {
//             res.status(200).json({ message: error.message });
//           } else {
//             res.json(data);
//           }
//         }
//       );
//     }
//   );
// };
const updateDriver = async (req, res) => {
  const {
    id,
    name,
    correspondenceAddress,
    dateOfBirth,
    telephone,
    fatherName,
    referencedBy,
    eyeSight,
    licenseNo,
    licenseType,
    remark,
    permanentAddress,
    qualification,
    mobile,
    joiningDate,
    bloodGroup,
    renewDate,
    expiryDate,
    branch
  } = req.body;

  const query = `
        SET @message = '';
        CALL updatedriver(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @message);
        SELECT @message as message;
    `;

  try {
    const [results] = await pool.query(query, [
      id,
      name,
      correspondenceAddress,
      dateOfBirth,
      telephone,
      fatherName,
      referencedBy,
      eyeSight,
      licenseNo,
      licenseType,
      remark,
      permanentAddress,
      qualification,
      mobile,
      joiningDate,
      bloodGroup,
      renewDate,
      expiryDate,
      branch
    ]);

    // Extract the message from the results
    const message = results[2][0].message;

    return res.json({ message });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};



// Get suppliers
// const getSuppliers = (req, res, next) => {
//   Supplier.find({ active: true })
//     .sort("-createdAt")
//     .exec((error, suppliers) => {
//       if (error) {
//         return res.status(200).json({
//           message: "Error fetching suppliers!",
//         });
//       } else {
//         res.json(suppliers);
//       }
//     });
// };
const getSuppliers = async (req, res) => {
  const query = 'CALL getallvehicleowner()';

  try {
    const [results] = await pool.query(query);
    const transformedResults = results[0]
      .reverse()
      .map(item => {
        const upperCaseItem = {};
        for (const key in item) {
          if (typeof item[key] === 'string') {
            upperCaseItem[key] = item[key].toUpperCase();
          } else {
            upperCaseItem[key] = item[key];
          }
        }
        return upperCaseItem;
      });

    return res.json(transformedResults);
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};




const getSuppliersByType = (req, res, next) => {
  if (!req.body.supplierType) {
    return res.status(200).json({ message: "Supplier type is required!" });
  }
  Supplier.find({ type: req.body.supplierType?.trim?.(), active: true }).exec(
    (error, suppliers) => {
      if (error) {
        return res.status(200).json({
          message: "Error fetching suppliers!",
        });
      } else {
        res.json(suppliers);
      }
    }
  );
};

// Get a supplier
// const getSupplier = (req, res, next) => {
//   Supplier.findById(req.params.id, (error, data) => {
//     if (error) {
//       res.json({ message: error.message });
//     } else {
//       res.json(data);
//     }
//   });
// };
const getSupplier = async (req, res, next) => {
  const id = req.params.id;

  try {
    const [results] = await pool.query('CALL getvehicleownerbyid(?)', [id]);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a supplier
// const addSupplier = (req, res, next) => {
//   const supplier = new Supplier({
//     name: req.body.name?.trim?.(),
//     type: req.body.type?.trim?.(),
//     address: req.body.address?.trim?.(),
//     state: req.body.state?.trim?.(),
//     city: req.body.city?.trim?.(),
//     phone: req.body.phone,
//     email: req.body.email?.trim?.(),
//     panNo: req.body.panNo,
//     vendorCode: req.body.vendorCode,
//     vatNo: req.body.vatNo,
//     cstNo: req.body.cstNo,
//     eccNo: req.body.eccNo,
//     contactPerson: req.body.contactPerson,
//     createdBy: req.body.createdBy,
//   });

//   Supplier.find(
//     {
//       name: { $regex: getRegex(req.body.name?.trim?.()), $options: "i" },
//       active: true,
//     },
//     (error, foundSupplier) => {
//       if (error) {
//         return next(error);
//       }
//       if (foundSupplier && foundSupplier.length > 0) {
//         let message = `Supplier with (${req.body.name}) & type (${req.body.type})  already exist!`;
//         return res.status(200).json({
//           message: message,
//         });
//       }
//       Supplier.create(supplier, (error, data) => {
//         if (error) {
//           res.send(error);
//         } else {
//           res.send(data);
//         }
//       });
//     }
//   );
// };

const addSupplier = async (req, res) => {
  const {
    name,
    type,
    address,
    city,
    phone,
    email,
    panNo,
    vendorCode,
    vatNo,
    cstNo,
    eccNo,
    contactPerson
  } = req.body;

  const ownerQuery = `
  SET @message = '';
  CALL addvehicleowner(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @message, ?, ?, ?, ?, ?, @inserted_id);
  SELECT @message as message, @inserted_id as inserted_id;
  `;

  const contactQuery = `
  CALL addvocontactpersondetails(?, ?, ?, ?, ?, ?);
  `;

  try {
    const [ownerResults] = await pool.query(ownerQuery, [
      name,
      address,
      phone,
      panNo,
      '', // gstno
      type,
      city,
      email,
      vendorCode,
      '0', // branch
      '', // bank
      eccNo,
      '', // ifsccode
      vatNo,
      cstNo
    ]);
    const message = ownerResults[1][0].message;
    const inserted_id = ownerResults[2][0].inserted_id;
    for (const contact of contactPerson) {
      const { name, designation, email, phone, address } = contact;
      await pool.query(contactQuery, [
        inserted_id,
        name,
        address,
        designation,
        email,
        phone
      ]);
    }
    return res.json({ message});
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};

// Update a supplier
// const updateSupplier = (req, res, next) => {
//   const _id = req.body._id;
//   if (!req.params.id || !_id) {
//     return res.status(200).json({ message: "Supplier ID is required!" });
//   }
//   Supplier.find(
//     {
//       name: { $regex: getRegex(req.body.name?.trim?.()), $options: "i" },
//       _id: { $ne: _id },
//       active: true,
//     },
//     (error, foundSupplier) => {
//       if (error) {
//         return next(error);
//       }
//       if (foundSupplier && foundSupplier.length > 0) {
//         let message = `Supplier with (${req.body.name}) & type (${req.body.type})  already exist!`;
//         return res.status(200).json({
//           message: message,
//         });
//       }
//       Supplier.findByIdAndUpdate(
//         _id,
//         {
//           $set: {
//             name: req.body.name?.trim?.(),
//             type: req.body.type?.trim?.(),
//             address: req.body.address?.trim?.(),
//             state: req.body.state?.trim?.(),
//             city: req.body.city?.trim?.(),
//             phone: req.body.phone,
//             email: req.body.email?.trim?.(),
//             panNo: req.body.panNo,
//             vendorCode: req.body.vendorCode,
//             vatNo: req.body.vatNo,
//             cstNo: req.body.cstNo,
//             eccNo: req.body.eccNo,
//             contactPerson: req.body.contactPerson,
//             updatedBy: req.body.updatedBy,
//           },
//         },
//         { new: true },
//         (error, data) => {
//           if (error) {
//             res.status(200).json({ message: error.message });
//           } else {
//             res.json(data);
//           }
//         }
//       );
//     }
//   );
// };
const updateSupplier = async (req, res) => {
  const id = req.params.id;
  const {
    name,
    type,
    address,
    city,
    phone,
    email,
    panNo,
    vendorCode,
    vatNo,
    cstNo,
    eccNo,
    contactPerson
  } = req.body;

  const updateOwnerQuery = `
      SET @message = '';
      CALL updatevehicleowner(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @message, ?, ?, ?, ?, ?);
      SELECT @message as message;
  `;

  const updateContactsQuery = `
      CALL addvocontactpersondetails(?, ?, ?, ?, ?, ?);
  `;

  try {
    // Update vehicle owner
    const [ownerResults] = await pool.query(updateOwnerQuery, [
      id,
      name,
      address,
      phone,
      panNo,
      '', // gstno
      type,
      city,
      email,
      vendorCode,
      '0', // branch
      '', // bank
      eccNo,
      '', // ifsccode
      vatNo,
      cstNo
    ]);

    // Extract the message from the results
    const message = ownerResults[2][0]?.message || 'Owner updated successfully';

    // Update contact persons
    for (const contact of contactPerson) {
      const { name, designation, email, phone, address } = contact;
      await pool.query(updateContactsQuery, [
        id,
        name,
        address,
        designation,
        email,
        phone
      ]);
    }

    return res.json({ message });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};


// Remove a supplier
// const removeSupplier = (req, res, next) => {
//   if (!req.params.id) {
//     return res.status(200).json({ message: "Supplier ID is required!" });
//   }
//   Supplier.findByIdAndUpdate(
//     req.params.id,
//     {
//       $set: {
//         active: false,
//         updatedBy: req.body.updatedBy,
//       },
//     },
//     { new: true },
//     (error, data) => {
//       if (error) {
//         res.status(200).json({ message: error.message });
//       } else {
//         res.json({ id: data._id });
//       }
//     }
//   );
// };
const removeSupplier = async (req, res) => {
  const id = req.params.id;
  const query = `
   SET @message = '';
       CALL deletevehicleowner(?, @message);
       SELECT @message as message;
  `;

  try {
    await pool.query(query, [id]);
    const [results] = await pool.query('SELECT @message as message');
    const message = results[0].message;
    return res.json({ message });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};

// Get vehicle types
// const getVehicleTypes = (req, res, next) => {
//   VehicleType.find({ active: true })
//     .sort("-createdAt")
//     .exec((error, vehicleTypes) => {
//       if (error) {
//         return res.status(200).json({
//           message: "Error fetching vehicle types!",
//         });
//       } else {
//         res.json(vehicleTypes);
//       }
//     });
// };
const getVehicleTypes = async (req, res, next) => {
  const query = 'CALL getallvehicletypes()';

  try {
    const [results] = await pool.query(query);
    const vehicleTypes = results[0];

    // Reverse the data and convert to uppercase
    const transformedVehicleTypes = vehicleTypes
      .reverse()
      .map(item => {
        const upperCaseItem = {};
        for (const key in item) {
          if (typeof item[key] === 'string') {
            upperCaseItem[key] = item[key].toUpperCase();
          } else {
            upperCaseItem[key] = item[key];
          }
        }
        return upperCaseItem;
      });

    res.json(transformedVehicleTypes);
  } catch (error) {
    console.error('Error fetching vehicle types:', error);
    res.status(500).json({
      message: 'Error fetching vehicle types!',
    });
  }
};



// Get a vehicle type
// const getVehicleType = (req, res, next) => {
//   VehicleType.findById(req.params.id, (error, data) => {
//     if (error) {
//       res.json({ message: error.message });
//     } else {
//       res.json(data);
//     }
//   });
// };
const getVehicleType = async (req, res) => {
  const id = req.params.id;
  const query = 'CALL getvehicletypebyid(?)';

  try {
    const [results] = await pool.query(query, [id]);
    return res.json(results[0]);
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};


// Add a vehicle type
// const addVehicleType = (req, res, next) => {
//   const vehicleType = new VehicleType({
//     type: req.body.type,
//     tyreQuantity: req.body.tyreQuantity,
//     createdBy: req.body.createdBy,
//   });

//   VehicleType.find(
//     { type: { $regex: getRegex(req.body.type?.trim?.()), $options: "i" } },
//     (error, foundType) => {
//       if (error) {
//         return next(error);
//       }
//       if (foundType && foundType.length > 0) {
//         const message = `Vehicle type with (${req.body.type} already exist!)`;
//         return res.status(200).json({
//           message: message,
//         });
//       }
//       VehicleType.create(vehicleType, (error, data) => {
//         if (error) {
//           res.send(error);
//         } else {
//           res.send(data);
//         }
//       });
//     }
//   );
// };
const addVehicleType = async (req, res) => {
  const { type, tyreQuantity, branch } = req.body;


  const query = `
      SET @message = '';
      CALL addvehicletype(?, ?, ?, @message);
      SELECT @message as message;
  `;

  try {
    // Execute the query to call the stored procedure
    await pool.query(query, [type, tyreQuantity, branch || null]);

    // Fetch the OUT parameter
    const [results] = await pool.query('SELECT @message as message');

    // Extract the message
    const message = results[0].message;


    // Send the response
    return res.json({ message });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};


// Remove a vehicle type
// const removeVehicleType = (req, res, next) => {
//   if (!req.params.id) {
//     return res.status(200).json({ message: "Vehicle type ID is required!" });
//   }
//   VehicleType.findByIdAndRemove(req.params.id, (error, data) => {
//     if (error) {
//       res.status(200).json({ message: error.message });
//     } else {
//       res.json({ id: data._id });
//     }
//   });
// };
const removeVehicleType = async (req, res) => {
  const id = req.params.id;
  const query = `
      SET @message = '';
      CALL deletevehicletype(?, @message);
      SELECT @message as message;
  `;

  try {
    await pool.query(query, [id]);
    const [results] = await pool.query('SELECT @message as message');
    const message = results[0].message;
    return res.json({ message });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};


// Update a vehicle type
// const updateVehicleType = (req, res, next) => {
//   const _id = req.body._id;

//   if (!req.params.id || !_id) {
//     return res.status(200).json({ message: "Vehicle type ID is required!" });
//   }
//   VehicleType.find(
//     {
//       type: { $regex: getRegex(req.body.type?.trim?.()), $options: "i" },
//       _id: { $ne: _id },
//     },
//     (error, foundType) => {
//       if (error) {
//         return next(error);
//       }
//       if (foundType && foundType.length > 0) {
//         const message = `Vehicle type with (${req.body.type} already exist!)`;
//         return res.status(200).json({
//           message: message,
//         });
//       }
//       VehicleType.findByIdAndUpdate(
//         _id,
//         {
//           $set: {
//             type: req.body.type,
//             tyreQuantity: req.body.tyreQuantity,
//             updatedBy: req.body.updatedBy,
//           },
//         },
//         { new: true },
//         (error, data) => {
//           if (error) {
//             res.status(200).json({ message: error.message });
//           } else {
//             res.json(data);
//           }
//         }
//       );
//     }
//   );
// };
const updateVehicleType = async (req, res) => {
  const in_branch = 10; // Set the branch ID as needed
  const { id, type, tyreQuantity } = req.body;



  const query = `
      SET @message = '';
      CALL updatevehicletype(?, ?, ?, ?, @message);
      SELECT @message as message;
  `;

  try {
    const [results] = await pool.query(query, [id, type, tyreQuantity, in_branch]);

    const message = results[2][0].message; 
    return res.json({ message });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};




// Get vehicles
// const getVehicles = (req, res, next) => {
//   Vehicle.find({ active: true })
//     .sort("-createdAt")
//     .exec((error, vehicles) => {
//       if (error) {
//         return res.status(200).json({
//           message: "Error fetching vehicles!",
//         });
//       } else {
//         res.json(vehicles);
//       }
//     });
// };
const getVehicles = async (req, res, next) => {
  const branch =  null;
  try {
    const [results] = await pool.query("CALL getallvehicles(?)", [branch]); 
    const filteredResults = results[0].map(item => ({
      vehicle_id: item.vehicle_id,
      vehicleno: item.vehicleno,
      make: item.make,
      reg_date: item.reg_date,
      vo_id: item.vo_id,
      engineno: item.engineno,
      capacity: item.capacity,
      chasisno: item.chasisno,
      description: item.description,
      vehical_owner_name: item.vehical_owner_name,
      address: item.address,
      telephoneno: item.telephoneno,
      vehicle_type: item.vehicle_type,
      expdays: item.expdays,
      pucexpdays: item.pucexpdays
    }));
    res.json(filteredResults); 
  } catch (error) {
    res.status(500).json({
      message: "Error fetching vehicles!",
      error: error.message,
    });
  }
};


// Get vehicles
// const getVehicleList = (req, res, next) => {
//   Vehicle.aggregate([
//     { $match: { active: true } },
//     {
//       $addFields: {
//         vehicleTypeId: {
//           $cond: {
//             if: {
//               $ne: ["$vehicleType", "UNKNOWN"],
//             },
//             then: { $toObjectId: "$vehicleType" },
//             else: "$vehicleType",
//           },
//         },
//       },
//     },
//     {
//       $addFields: {
//         supplierId: {
//           $cond: {
//             if: {
//               $ne: ["$owner", "UNKNOWN"],
//             },
//             then: { $toObjectId: "$owner" },
//             else: "$owner",
//           },
//         },
//       },
//     },
//     {
//       $lookup: {
//         from: "vehicleType",
//         localField: "vehicleTypeId",
//         foreignField: "_id",
//         as: "vehicleObj",
//       },
//     },
//     { $unwind: { path: "$vehicleObj", preserveNullAndEmptyArrays: true } },
//     {
//       $lookup: {
//         from: "supplier",
//         localField: "supplierId",
//         foreignField: "_id",
//         as: "ownerObj",
//       },
//     },
//     { $unwind: { path: "$ownerObj", preserveNullAndEmptyArrays: true } },
//     {
//       $addFields: {
//         vehicleType: {
//           $cond: {
//             if: {
//               $ne: ["$vehicleObj.type", null],
//             },
//             then: "$vehicleObj.type",
//             else: "$vehicleType",
//           },
//         },
//       },
//     },
//     {
//       $addFields: {
//         ownerName: {
//           $cond: {
//             if: {
//               $ne: ["$ownerObj", null],
//             },
//             then: "$ownerObj.name",
//             else: "$owner",
//           },
//         },
//       },
//     },
//     {
//       $addFields: {
//         ownerAddress: "$ownerObj.address",
//       },
//     },
//     { $sort: { createdAt: -1 } },
//     {
//       $project: {
//         _id: 1,
//         vehicleNo: 1,
//         ownerName: 1,
//         ownerAddress: 1,
//         vehicleType: 1,
//         owner: 1,
//         vehicleTypeId: 1,
//       },
//     },
//   ]).exec((error, vehicles) => {
//     if (error) {
//       return res.status(200).json({
//         message: "Error fetching vehicles!",
//       });
//     } else {
//       res.json(vehicles);
//     }
//   });
// };
const getVehicleList = async (req, res) => {
  const branch = null; // Assuming branch is null for now
  const query = 'CALL getallvehicles(?)';

  try {
    const [results] = await pool.query(query, [branch]);

    const vehicles = results[0];
    const vehicleList = vehicles.map((vehicle) => ({
      vehicle_id: vehicle.vehicle_id,
      vehicleno: vehicle.vehicleno,
      vehical_owner_name: vehicle.vehical_owner_name,
      address: vehicle.address,
      vehicletype: vehicle.vehicle_type,
      telephoneno: vehicle.telephoneno,
      vehicleownerid: vehicle.vo_id
    }));
    const transformedVehicleList = vehicleList.reverse().map(vehicle => {
      return Object.fromEntries(
        Object.entries(vehicle).map(([key, value]) => [
          key,
          typeof value === 'string' ? value.toUpperCase() : value
        ])
      );
    });

    return res.json(transformedVehicleList);
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};



// Get a vehicle
// const getVehicle = (req, res, next) => {
//   Vehicle.findById(req.params.id, (error, data) => {
//     if (error) {
//       res.json({ message: error.message });
//     } else {
//       res.json(data);
//     }
//   });
// };
const getVehicle = async (req, res) => {
  const id = req.params.id.toString();
  const query = 'CALL getvehiclebyid(?)';

  try {
    const [results] = await pool.query(query, [id]);
    const vehicleDetails = results[0][0]; 
    const taxDetails = results[1]; 
      return res.json({
        vehicle: vehicleDetails,
        taxDetails: taxDetails
      });
  } catch (err) {
    console.error('Error executing query:', err);
    return res.status(500).send('Server error');
  }
};



// Add a vehicle
// const addVehicle = (req, res, next) => {
//   const vehicle = new Vehicle({
//     owner: req.body.owner?.trim?.(),
//     vehicleNo: req.body.vehicleNo?.toUpperCase()?.trim?.(),
//     vehicleType: req.body.vehicleType?.trim?.(),
//     make: req.body.make,
//     capacity: req.body.capacity,
//     regDate: req.body.regDate,
//     chassisNo: req.body.chassisNo,
//     engineNo: req.body.engineNo,
//     description: req.body.description?.trim?.(),
//     taxDetails: req.body.taxDetails,
//     createdBy: req.body.createdBy,
//   });

//   Vehicle.find(
//     {
//       vehicleNo: {
//         $regex: getRegex(req.body.vehicleNo?.trim?.()),
//         $options: "i",
//       },
//     },
//     (error, foundVehicle) => {
//       if (error) {
//         return next(error);
//       }
//       if (foundVehicle && foundVehicle.length > 0) {
//         let message = `Vehicle with number (${req.body.vehicleNo}) already exist!`;
//         return res.status(200).json({
//           message: message,
//         });
//       }
//       Vehicle.create(vehicle, (error, data) => {
//         if (error) {
//           return res.status(200).json({ message: error.message });
//         } else {
//           res.send(data);
//         }
//       });
//     }
//   );
// };
const addVehicle = async (req, res) => {
  const {
    owner,
    vehicleType,
    vehicleNo,
    capacity,
    make,
    description,
    regDate,
    expDate,
    engineNo,
    chassisNo,
    pucNo,
    pucExpDate,
    body,
    remark,
    branch,
    taxDetails,
  } = req.body;

  const query = `
      SET @message = '';
      CALL insertvehicledetails(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @message);
      SELECT @message as message, LAST_INSERT_ID() as vehicleId;
  `;

  try {
    const [results] = await pool.query(query, [
      owner,
      vehicleNo,
      make,
      regDate,
      engineNo,
      vehicleType,
      capacity,
      chassisNo,
      description,
      '',                   
      '',                   
      '',                 
      '',                   
      '',                  
      '',                 
      remark,
      branch,
      expDate,
      pucNo,
      pucExpDate,
      body
    ]);
  
    const message = results[1][0].message;
    const vehicleId = results[3][0].vehicleId;
    
    if (!vehicleId) {
      return res.status(200).json({ message});
    }
    for (const taxDetail of taxDetails) {
      const { taxType, amount, startDate, endDate, description: taxDescription } = taxDetail;
      const formattedStartDate = new Date(startDate).toISOString().split('T')[0];
      const formattedEndDate = new Date(endDate).toISOString().split('T')[0];
      await pool.query(`
          INSERT INTO tax_details (vehicle_id, tax_type, tax_start_date, description, amount, tax_end_date) 
          VALUES (?, ?, ?, ?, ?, ?)`,
        [vehicleId, taxType, formattedStartDate, taxDescription, amount, formattedEndDate]
      );
    }

    return res.json({ message });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};






// Update a vehicle
// const updateVehicle = (req, res, next) => {
//   const _id = req.body._id;
//   if (!req.params.id || !_id) {
//     return res.status(200).json({ message: "Vehicle ID is required!" });
//   }
//   Vehicle.find(
//     {
//       vehicleNo: {
//         $regex: getRegex(req.body.vehicleNo?.trim?.()),
//         $options: "i",
//       },
//       _id: { $ne: _id },
//     },
//     (error, foundVehicle) => {
//       if (error) {
//         return next(error);
//       }
//       if (foundVehicle && foundVehicle.length > 0) {
//         let message = `Vehicle with number (${req.body.vehicleNo}) already exist!`;
//         return res.status(200).json({
//           message: message,
//         });
//       }
//       Vehicle.findByIdAndUpdate(
//         _id,
//         {
//           $set: {
//             owner: req.body.owner?.trim?.(),
//             vehicleNo: req.body.vehicleNo?.toUpperCase()?.trim?.(),
//             vehicleType: req.body.vehicleType?.trim?.(),
//             make: req.body.make,
//             capacity: req.body.capacity,
//             regDate: req.body.regDate,
//             chassisNo: req.body.chassisNo,
//             engineNo: req.body.engineNo,
//             description: req.body.description?.trim?.(),
//             taxDetails: req.body.taxDetails,
//             updatedBy: req.body.updatedBy,
//           },
//         },
//         { new: true },
//         (error, data) => {
//           if (error) {
//             res.status(200).json({ message: error.message });
//           } else {
//             res.json(data);
//           }
//         }
//       );
//     }
//   );
// };
const updateVehicle = async (req, res) => {
  const branchId = req.params.branch || null;
  const id = req.params.id;

  const {
    vehicle_id,
    vehicleno,
    make,
    reg_date: regDate,
    engineno: engineNo,
    capacity,
    chasisno: chasisNo,
    vehicle_description: vehicle_description,
    vod_id,
    vt_id,
    vehicleexpdate: expDate,
    pucno,
    pucexpdate,
    body,
    taxDetails,
    updatedBy,
  } = req.body;

  const query = `
      SET @message = '';
      SET @inserted_id = 0;  -- Initialize the inserted_id variable
      CALL updatevehicle(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, @message, @inserted_id);
      SELECT @message AS message, @inserted_id AS inserted_id;  -- Return both message and inserted_id
  `;

  try {
    const [results] = await pool.query(query, [
      vehicle_id || id,
      vod_id,
      vehicleno,
      make,
      regDate,
      engineNo,
      vt_id,
      capacity,
      chasisNo,
      vehicle_description,
      branchId,
      expDate,
      pucno,
      pucexpdate,
      body,
      '',  
      '',  
    ]);

    const messageData = results[3];
    const message = messageData[0].message;
    const insertedId = messageData[0].inserted_id;
    await pool.query(`
      DELETE FROM tax_details WHERE vehicle_id = ?
    `, [vehicle_id || insertedId]);

    if (taxDetails && taxDetails.length > 0) {
      const taxQueries = taxDetails.map(tax => {
        return pool.query(`
          INSERT INTO tax_details (vehicle_id, description, tax_type, amount, tax_start_date, tax_end_date)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [
          vehicle_id || insertedId, 
          tax.description,
          tax.taxType,
          tax.amount,
          tax.startDate,
          tax.endDate
        ]);
      });
      await Promise.all(taxQueries);
    }
    return res.json({ message, insertedId });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};




// Remove a vehicle
// const removeVehicle = (req, res, next) => {
//   if (!req.params.id) {
//     return res.status(200).json({ message: "Vehicle ID is required!" });
//   }
//   Vehicle.findByIdAndRemove(req.params.id, (error, data) => {
//     if (error) {
//       res.status(200).json({ message: error.message });
//     } else {
//       res.json({ id: data._id });
//     }
//   });
// };
const removeVehicle = async (req, res) => {
  const id = req.params.id.toString();


  const query = `
      SET @message = '';
      CALL deletevehicle(?, @message);
      SELECT @message AS message;
  `;

  try {
    const [results] = await pool.query(query, [id]);

    // The message is in the second result set
    let message = 'No message';
    if (results.length > 1) {
      // The second item in results should be the message result set
      const messageResult = results[1];
      if (messageResult.length > 0) {
        message = messageResult[0].message;
      }
    }


    return res.json({ message });
  } catch (err) {
    console.error('Error executing query:', err);
    return res.status(500).send('Server error');
  }
};


// Get banks
const getBanks = (req, res, next) => {
  Bank.find({ active: true })
    .sort("-createdAt")
    .exec((error, banks) => {
      if (error) {
        return res.status(200).json({
          message: "Error fetching banks!",
        });
      } else {
        res.json(banks);
      }
    });
};

// Get a bank
const getBank = (req, res, next) => {
  Bank.findById(req.params.id, (error, data) => {
    if (error) {
      res.json({ message: error.message });
    } else {
      res.json(data);
    }
  });
};

// Add a bank
const addBank = (req, res, next) => {
  const bank = new Bank({
    name: req.body.name?.trim?.(),
    branchName: req.body.branchName?.trim?.(),
    branchCode: req.body.branchCode?.trim?.(),
    ifsc: req.body.ifsc?.trim?.(),
    micr: req.body.micr?.trim?.(),
    phone: req.body.phone,
    email: req.body.email?.trim?.(),
    address: req.body.address?.trim?.(),
    createdBy: req.body.createdBy,
  });

  Bank.find(
    {
      ifsc: { $regex: getRegex(req.body.ifsc?.trim?.()), $options: "i" },
      active: true,
    },
    (error, foundBank) => {
      if (error) {
        return next(error);
      }
      if (foundBank && foundBank.length > 0) {
        let message = `Bank with ifsc number (${req.body.ifsc}) already exist!`;
        return res.status(200).json({
          message: message,
        });
      }
      Bank.create(bank, (error, data) => {
        if (error) {
          if (error.code === 11000) {
            return res.status(200).json({
              message: `Bank with ifsc or micr (${req.body.name}) already exist!`,
            });
          }
          res.send(error);
        } else {
          res.send(data);
        }
      });
    }
  );
};

// Update a bank
const updateBank = (req, res, next) => {
  const _id = req.body._id;
  if (!req.params.id || !_id) {
    return res.status(200).json({ message: "Bank ID is required!" });
  }
  Bank.find(
    {
      ifsc: { $regex: getRegex(req.body.ifsc?.trim?.()), $options: "i" },
      _id: { $ne: _id },
      active: true,
    },
    (error, foundBank) => {
      if (error) {
        return next(error);
      }
      if (foundBank && foundBank.length > 0) {
        let message = `Bank with ifsc number (${req.body.ifsc}) already exist!`;
        return res.status(200).json({
          message: message,
        });
      }
      Bank.findByIdAndUpdate(
        _id,
        {
          $set: {
            name: req.body.name?.trim?.(),
            branchName: req.body.branchName?.trim?.(),
            branchCode: req.body.branchCode?.trim?.(),
            ifsc: req.body.ifsc?.trim?.(),
            micr: req.body.micr?.trim?.(),
            phone: req.body.phone,
            email: req.body.email?.trim?.(),
            address: req.body.address?.trim?.(),
            updatedBy: req.body.updatedBy,
          },
        },
        { new: true },
        (error, data) => {
          if (error) {
            res.status(200).json({ message: error.message });
          } else {
            res.json(data);
          }
        }
      );
    }
  );
};

// Remove a bank
const removeBank = (req, res, next) => {
  if (!req.params.id) {
    return res.status(200).json({ message: "Bank ID is required!" });
  }

  Bank.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        active: false,
        updatedBy: req.body.updatedBy,
      },
    },
    { new: true },
    (error, data) => {
      if (error) {
        res.status(200).json({ message: error.message });
      } else {
        res.json({ id: data._id });
      }
    }
  );
};

// Get banks
const getBankAccounts = (req, res, next) => {
  BankAccount.find({ active: true })
    .sort("-createdAt")
    .exec((error, banks) => {
      if (error) {
        return res.status(200).json({
          message: "Error fetching bank accounts!",
        });
      } else {
        res.json(banks);
      }
    });
};

// Get banks
const getBankAccountList = (req, res, next) => {
  BankAccount.aggregate([
    { $match: { active: true } },
    {
      $addFields: {
        bankId: { $toObjectId: "$bank" },
      },
    },
    {
      $lookup: {
        from: "bank",
        localField: "bankId",
        foreignField: "_id",
        as: "bank",
      },
    },
    { $unwind: { path: "$bank", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        bank: "$bank.name",
      },
    },
    { $sort: { createdAt: -1 } },
    {
      $project: {
        _id: 1,
        accountNo: 1,
        accountHolder: 1,
        accountType: 1,
        bank: 1,
        ifsc: 1,
        openingBalance: 1,
      },
    },
  ]).exec((error, banks) => {
    if (error) {
      return res.status(200).json({
        message: "Error fetching bank accounts!",
      });
    } else {
      res.json(banks);
    }
  });
};

// Get a bank
const getBankAccount = (req, res, next) => {
  BankAccount.findById(req.params.id, (error, data) => {
    if (error) {
      res.json({ message: error.message });
    } else {
      res.json(data);
    }
  });
};

// Add a bank
const addBankAccount = (req, res, next) => {
  const bankAccount = new BankAccount({
    bank: req.body.bank?.trim?.(),
    ifsc: req.body.ifsc?.trim?.(),
    accountType: req.body.accountType,
    accountHolder: req.body.accountHolder?.trim?.(),
    customerId: req.body.customerId,
    accountNo: req.body.accountNo?.trim?.(),
    openingBalance: req.body.openingBalance,
    createdBy: req.body.createdBy,
  });

  BankAccount.find(
    {
      accountNo: {
        $regex: getRegex(req.body.accountNo?.trim?.()),
        $options: "i",
      },
      active: true,
    },
    (error, foundBankAccount) => {
      if (error) {
        return next(error);
      }
      if (foundBankAccount && foundBankAccount.length > 0) {
        let message = `Bank account with account number (${req.body.ifsc}) already exist!`;
        return res.status(200).json({
          message: message,
        });
      }
      BankAccount.create(bankAccount, (error, data) => {
        if (error) {
          res.send(error);
        } else {
          res.send(data);
        }
      });
    }
  );
};

// Update a bank
const updateBankAccount = (req, res, next) => {
  const _id = req.body._id;
  if (!req.params.id || !_id) {
    return res.status(200).json({ message: "Bank account ID is required!" });
  }
  BankAccount.find(
    {
      accountNo: {
        $regex: getRegex(req.body.accountNo?.trim?.()),
        $options: "i",
      },
      _id: { $ne: _id },
      active: true,
    },
    (error, foundBankAccount) => {
      if (error) {
        return next(error);
      }
      if (foundBankAccount && foundBankAccount.length > 0) {
        let message = `Bank account with account number (${req.body.ifsc}) already exist!`;
        return res.status(200).json({
          message: message,
        });
      }
      BankAccount.findByIdAndUpdate(
        _id,
        {
          $set: {
            bank: req.body.bank?.trim?.(),
            ifsc: req.body.ifsc?.trim?.(),
            accountType: req.body.accountType?.trim?.(),
            accountHolder: req.body.accountHolder?.trim?.(),
            customerId: req.body.customerId,
            accountNo: req.body.accountNo?.trim?.(),
            openingBalance: req.body.openingBalance,
            updatedBy: req.body.updatedBy,
          },
        },
        { new: true },
        (error, data) => {
          if (error) {
            res.status(200).json({ message: error.message });
          } else {
            res.json(data);
          }
        }
      );
    }
  );
};

// Remove a bank
const removeBankAccount = (req, res, next) => {
  if (!req.params.id) {
    return res.status(200).json({ message: "Bank account ID is required!" });
  }

  BankAccount.findByIdAndUpdate(
    req.params.id,
    {
      $set: {
        active: false,
        updatedBy: req.body.updatedBy,
      },
    },
    { new: true },
    (error, data) => {
      if (error) {
        res.status(200).json({ message: error.message });
      } else {
        res.json({ id: data._id });
      }
    }
  );
};

// const getLastEmployee = (req, res) => {
//   Employee.findOne({}, {}, { sort: { createdAt: -1 } }, (err, data) => {
//     if (err) {
//       res.status(200).json({ message: err.message });
//     } else {
//       res.json(data);
//     }
//   });
// };
const getLastEmployee = async (req, res) => {
  const id = req.params.id;

  const query = 'SELECT * FROM employee WHERE id = ?';

  try {
    const [results] = await pool.query(query, [id]);

    if (results.length === 0) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(results[0]); // Send the found employee
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};



const getLastDriver = (req, res) => {
  Driver.findOne({}, {}, { sort: { createdAt: -1 } }, (err, data) => {
    if (err) {
      res.status(200).json({ message: err.message });
    } else {
      res.json(data);
    }
  });
};

// const getRateListWithPagination = async (req, res, next) => {
//   try {
//     const { page = 1, limit = 100 } = req.body.pagination || {};
//     const start = (page - 1) * limit;
//     const param = { active: true };
//     if (req.body.search) {
//       const searchText = new RegExp(req.body.search);
//       param["$or"] = [{ customerName: { $regex: searchText, $options: "i" } }];
//     }
//     const rateList = await RateMaster.find(param, "_id customerName")
//       .skip(start)
//       .limit(limit)
//       .lean();
//     const count = await RateMaster.countDocuments(param);
//     res.json({
//       rateList,
//       count,
//     });
//   } catch (error) {
//     res.status(200).json({
//       message: "Error fetching rateList!",
//       error: error.message,
//     });
//   }
// };
const getRateListWithPagination = async (req, res, next) => {
  try {
    const { page = 1, limit = 100 } = req.body.pagination || {};
    const start = (page - 1) * limit;
    const searchText = req.body.search ? req.body.search.toLowerCase() : null;
    const query = 'CALL getallratemaster()';
    const [results] = await pool.query(query);

    const rateList = results[0];
    const filteredRateList = searchText
      ? rateList.filter(rate => rate.customer_name.toLowerCase().includes(searchText))
      : rateList;

    const paginatedRateList = filteredRateList.slice(start, start + limit);
    const count = filteredRateList.length;

    res.json({
      rateList: paginatedRateList,
      count,
    });
  } catch (error) {
    console.error('Error fetching rate list:', error);
    res.status(500).json({
      message: "Error fetching rateList!",
      error: error.message,
    });
  }
};


// const addToRateMaster = (req, res) => {
//   if (!req.body.customer && !req.body.customerName) {
//     return res.status(200).json({ message: "Customer is required!" });
//   }

//   RateMaster.findOne(
//     {
//       customer: {
//         $regex: getRegex(req.body.customer?.trim?.()),
//         $options: "i",
//       },

//       active: true,
//     },
//     (foundErr, foundRateList) => {
//       if (foundErr) {
//         return res.status(200).json({ message: foundErr.message });
//       }
//       if (foundRateList) {
//         return res.status(200).json({
//           message: `Rate list for ${req.body.customerName} already exist!`,
//         });
//       }
//       if (!foundErr && !foundRateList) {
//         if (req.body.rates.length) {
//           req.body.rates.forEach(async (rate, index) => {
//             try {
//               const foundArticle = await Article.findOne({
//                 name: {
//                   $regex: getRegex(rate.article?.toUpperCase()?.trim?.()),
//                   $options: "i",
//                 },
//               });
//               if (foundArticle) {
//                 rate.article = foundArticle.name?.toUpperCase();
//                 if (index === req.body.rates.length - 1) {
//                   const rateList = new RateMaster({
//                     customer: req.body.customer,
//                     customerName: req.body.customerName
//                       ?.toUpperCase()
//                       ?.trim?.(),
//                     rates: req.body.rates,
//                     createdBy: req.body.createdBy,
//                   });
//                   RateMaster.create(rateList, (error, data) => {
//                     if (error) {
//                       if (error.code === 11000) {
//                         return res.status(200).json({
//                           message: `Rate Master with customer name (${rateList.customerName}) already exist!`,
//                         });
//                       }
//                       return res.status(200).json({ message: error.message });
//                     } else {
//                       return res.send(data);
//                     }
//                   });
//                 }
//               } else {
//                 const article = new Article({
//                   name: rate.article?.toUpperCase(),
//                   createdBy: req.body.createdBy,
//                 });
//                 const createdArticle = await Article.create(article);
//                 if (createdArticle) {
//                   rate.article = createdArticle.name?.toUpperCase();
//                   if (index === req.body.rates.length - 1) {
//                     const rateList = new RateMaster({
//                       customer: req.body.customer,
//                       customerName: req.body.customerName
//                         ?.toUpperCase()
//                         ?.trim?.(),
//                       rates: req.body.rates,
//                       createdBy: req.body.createdBy,
//                     });
//                     if (rateList) {
//                       RateMaster.create(rateList, (error, data) => {
//                         if (error) {
//                           return res.status(200).json({
//                             message: error.message,
//                           });
//                         } else {
//                           return res.send(data);
//                         }
//                       });
//                     }
//                   }
//                 }
//               }
//             } catch (e) {
//               return res.status(200).json({ message: e.message });
//             }
//           });
//         } else {
//           return res
//             .status(200)
//             .json({ message: "Rate master list is required" });
//         }
//       }
//     }
//   );
// };

const addToRateMaster = async (req, res) => {
  const {
    customer,
    rates,
    LRCharges,
    createdBy
  } = req.body;


  if (!rates || rates.length === 0) {
    return res.status(400).json({ message: 'No rates provided' });
  }

  // Call the stored procedure once for the customer
  const query = `
    SET @message = '';
    SET @inserted_id = 0;
    CALL addratemaster(?, ?, ?, ?, ?, ?, ?, ?, ?, @inserted_id, @message);
    SELECT @message AS message, @inserted_id AS inserted_id;
  `;

  let rateMasterId;
  let message;

  try {
    const [results] = await pool.query(query, [
      customer.id, // Customer ID
      null,        // Article ID (not used)
      null,        // From Station ID (not used)
      null,        // To Station ID (not used)
      null,        // Rate (not used)
      createdBy,   // User ID
      null,        // Branch (if applicable)
      new Date().toISOString().slice(0, 19).replace('T', ' '),
      LRCharges
    ]);

    message = results[3][0].message;
    rateMasterId = results[3][0].inserted_id;

  } catch (err) {
    console.error('Error calling stored procedure:', err);
    return res.status(500).send('Server error while calling stored procedure');
  }

  // Now, process each rate and insert into rate_master_details
  const rateDetailPromises = rates.map(async (rateItem) => {
    const {
      articleId,
      fromPlace,
      stationId,
      rate,
      ddCharges,
      hamaliRate
    } = rateItem;

    const insertQuery = `
      INSERT INTO rate_master_details (rate_master_id, article_id, from_id, rate, ddcharges,HamaliRate)
      VALUES (?, ?, ?, ?, ?, ?);
    `;

    try {
      await pool.query(insertQuery, [
        rateMasterId, // Use the rate_master_id from the stored procedure
        articleId,    // Article ID from the rate item
        stationId,    // From Place (assuming it's meant to be the From ID)
        rate,         // Rate from the rate item
        ddCharges || null,     // DD Charges from the rate item
        hamaliRate
      ]);
    } catch (err) {
      console.error('Error inserting into rate_master_details:', err);
      throw new Error('Database operation failed while inserting rate details');
    }
  });

  try {
    await Promise.all(rateDetailPromises);
    return res.json({ message, rateMasterId });
  } catch (err) {
    return res.status(500).send('Server error while inserting rate details');
  }
};









// const getCustomersForRateMaster = async (req, res) => {
//   try {
//     const search = req.body.search;

//     const param = { active: true };
//     if (search) {
//       param.name = { $regex: new RegExp(search?.trim?.()), $options: "i" };
//     }
//     const allRateMaster = await RateMaster.find({ active: true });
//     if (allRateMaster && allRateMaster.length) {
//       const customers = allRateMaster.map((rate) => rate.customer);
//       const foundCustomers = await Customer.find(
//         {
//           _id: { $nin: customers },
//           ...param,
//         },
//         "_id, name"
//       )
//         .limit(100)
//         .lean();
//       if (foundCustomers) {
//         return res.send(foundCustomers);
//       }
//     } else {
//       const foundCustomers = await Customer.find({ ...param }, "_id, name")
//         .limit(100)
//         .lean();
//       if (foundCustomers) {
//         return res.send(foundCustomers);
//       }
//     }
//   } catch (e) {
//     return res.status(200).json({ message: e.message });
//   }
// };
const getCustomersForRateMaster = async (req, res) => {
  try {
    const query = `
     SELECT customer_id, customer_name, city 
      FROM customer;
    `;

    const result = await pool.query(query);
    return res.status(200).json(result[0]);
  } catch (e) {
    console.error('Error fetching customers:', e);
    return res.status(500).json({ message: 'Internal Server Error', error: e.message });
  }
};



const getforADDCustomersForRateMaster = async (req, res) => {
  try {
    const query = `
    SELECT customer_id, customer_name, city
      FROM customer c
      WHERE NOT EXISTS (
        SELECT 1
        FROM rate_master rm
        WHERE rm.customerid = c.customer_id
      );
    `;

    const result = await pool.query(query);
    return res.status(200).json(result[0]);
  } catch (e) {
    console.error('Error fetching customers:', e);
    return res.status(500).json({ message: 'Internal Server Error', error: e.message });
  }
};




// const getRateMasterById = async (req, res) => {
//   if (!req.params.id) {
//     return res.status(200).json({ message: "Rate master id is required!" });
//   }
//   try {
//     const response = await RateMaster.findById(req.params.id);
//     if (response) {
//       return res.send(response);
//     }
//   } catch (e) {
//     return res.status(200).json({ message: e.message });
//   }
// };

// const removeRateMasterById = async (req, res) => {
//   if (!req.params.id) {
//     return res.status(200).json({ message: "Rate master id is required!" });
//   }
//   try {
//     const response = await RateMaster.findByIdAndUpdate(
//       req.params.id,
//       {
//         $set: {
//           active: false,
//           updatedBy: req.body.updatedBy,
//         },
//       },
//       { new: true }
//     );
//     if (response) {
//       return res.send(response);
//     }
//   } catch (e) {
//     return res.status(200).json({ message: e.message });
//   }
// };
const getRateMasterById = async (req, res) => {
  const id = req.params.id.toString();

  const query = 'CALL getratemasterbyid(?)';

  try {
    const [results] = await pool.query(query, [id]);

    return res.json(results[0]);

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};


const removeRateMasterById = async (req, res) => {
  const id = req.params.id.toString();
  const query = `
      SET @message = '';
      CALL deleteratemaster(?, @message);
      SELECT @message as message;
  `;

  try {
    const [results] = await pool.query(query, [id]);
    const message = results[2][0].message;

    return res.json({ message });

  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};

// const updateRateMaster = (req, res) => {
//   if (!req.body.rates.length) {
//     return res.status(200).json({ message: "Rate master list is required" });
//   }
//   if (!req.body._id) {
//     return res.status(200).json({ message: "Rate master id is required" });
//   }

//   RateMaster.findOne(
//     {
//       customer: {
//         $regex: getRegex(req.body.customer?.trim?.()),
//         $options: "i",
//       },

//       active: true,
//       _id: { $ne: req.body._id },
//     },
//     (foundErr, foundRateList) => {
//       if (foundErr) {
//         return res.status(200).json({ message: foundErr.message });
//       }
//       if (foundRateList) {
//         return res.status(200).json({
//           message: `Rate list for ${req.body.customerName} already exist!`,
//         });
//       }
//       const udpatedRates = [];
//       req.body.rates.forEach(async (rate) => {
//         try {
//           const foundArticle = await Article.findOne({
//             name: {
//               $regex: getRegex(rate.article?.toUpperCase()?.trim?.()),
//               $options: "i",
//             },
//           });
//           if (foundArticle) {
//             rate.article = foundArticle.name?.toUpperCase();
//             udpatedRates.push(rate);
//             if (udpatedRates.length === req.body.rates.length) {
//               const saveRate = [...udpatedRates];
//               RateMaster.findByIdAndUpdate(
//                 req.body._id,
//                 {
//                   $set: {
//                     rates: saveRate,
//                     updatedBy: req.body.updatedBy,
//                   },
//                 },
//                 { new: true },
//                 (error, data) => {
//                   if (error) {
//                     return res.status(200).json({ message: error.message });
//                   } else {
//                     return res.json(data);
//                   }
//                 }
//               );
//             }
//           } else {
//             const article = new Article({
//               name: rate.article?.toUpperCase(),
//               createdBy: req.body.createdBy,
//             });
//             const createdArticle = await Article.create(article);
//             if (createdArticle) {
//               rate.article = createdArticle.name?.toUpperCase();
//               udpatedRates.push(rate);
//             }
//             if (udpatedRates.length === req.body.rates.length) {
//               const saveRate = [...udpatedRates];
//               RateMaster.findByIdAndUpdate(
//                 req.body._id,
//                 {
//                   $set: {
//                     rates: saveRate,
//                     updatedBy: req.body.updatedBy,
//                   },
//                 },
//                 { new: true },
//                 (error, data) => {
//                   if (error) {
//                     return res.status(200).json({ message: error.message });
//                   } else {
//                     return res.json(data);
//                   }
//                 }
//               );
//             }
//           }
//         } catch (e) {
//           return res.status(200).json({ message: e.message });
//         }
//       });
//     }
//   );
// };
const updateRateMaster = async (req, res) => {
  const {
    id, 
    rates = [], 
    LRCharges,
    updatedBy 
  } = req.body;

  try {
    // If no rates are provided, return an error
    if (rates.length === 0) {
      return res.status(400).json({ error: 'No rates provided' });
    }
    if (id) {
      const updateLRChargesQuery = `
        UPDATE rate_master 
        SET LRCharges = ? 
        WHERE id = ?;
      `;
      await pool.query(updateLRChargesQuery, [LRCharges, id]);
    }
    // Delete old rate master details before updating
    const deleteQuery = `
      DELETE FROM rate_master_details 
      WHERE rate_master_id = ?;
    `;

    await pool.query(deleteQuery, [id]);

    // Insert or update the rate master details
    const insertOrUpdatePromises = rates.map(rateEntry => {
      const insertOrUpdateQuery = `
        INSERT INTO rate_master_details (rate_master_id, article_id, from_id, rate, ddcharges,HamaliRate)
        VALUES (?, ?, ?, ?, ?,?)
      `;
      return pool.query(insertOrUpdateQuery, [
        id, 
        rateEntry.article_id || rateEntry.articleId, 
        rateEntry.from_id || rateEntry.stationId, 
        rateEntry.rate,
        rateEntry.ddcharges || null,
        rateEntry.hamaliRate
      ]);
    });
    await Promise.all(insertOrUpdatePromises);

    return res.json({ message: 'Updated Successfully' });
  } catch (err) {
    console.error('Error:', err);
    return res.status(500).send('Server error');
  }
};

const getRateMasterByCustomer = async (req, res) => {
  if (!req.params.id) {
    return res.status(200).json({ message: "Customer id is required" });
  }
  try {
    const rateMaster = await RateMaster.findOne({ customer: req.params.id });
    return res.send({ rateMaster: rateMaster });
  } catch (e) {
    return res.status(200).json({ message: e.message });
  }
};

// Add a TransactionPrefix
const addTransactionPrefix = (req, res, next) => {
  const transactionPrefix = new TransactionPrefix({
    name: req.body.name?.toUpperCase?.(),
    prefix: req.body.prefix,
    current: 1,
    createdBy: req.body.createdBy,
  });

  TransactionPrefix.findOne(
    {
      name: {
        $regex: getRegex(req.body.name?.trim?.()),
        $options: "i",
      },
    },
    (error, foundPrefix) => {
      if (error) {
        return next(error);
      }
      if (foundPrefix) {
        return res.status(200).json({
          message: `TransactionPrefix with name (${foundPrefix.name}) already exist!`,
        });
      }
      TransactionPrefix.create(transactionPrefix, (error, data) => {
        if (error) {
          return res.send(error);
        } else {
          return res.json(data);
        }
      });
    }
  );
};
const getTransactionPrefix = (req, res, next) => {
  const number = 1;
  LorryReceipt.findOne(
    { lrNo: { $regex: req.params.code?.trim?.() } },
    {},
    { sort: { createdAt: -1 } },
    function (err, lr) {
      if (lr) {
        const currentNum = lr.lrNo?.split("-");
        const numLeadingZeros = parseInt(
          currentNum[currentNum?.length - 1]?.replace(/[^0-9]/g, "")
        );
        return res.send(
          `${req.params.code}-${(numLeadingZeros + 1 + "").padStart(6, "0")}`
        );
      } else {
        return res.send(`${req.params.code}-${(number + "").padStart(6, "0")}`);
      }
    }
  );
};

const getRegex = (str) => `^${str}$`;

module.exports = {
  addBranch,
  getBranches,
  getBranchList,
  getBranch,
  removeBranch,
  updateBranch,
  getPlaces,
  addPlace,
  removePlace,
  updatePlace,
  getPlace,
  addEmployee,
  getEmployees,
  removeEmployee,
  updateEmployee,
  getEmployee,
  getArticles,
  getArticle,
  addArticle,
  removeArticle,
  updateArticle,
  getCustomers,
  getCustomersByBranch,
  getCustomersWithPagination,
  getCustomersForDrop,
  getCustomer,
  addCustomer,
  updateCustomer,
  removeCustomer,
  getDrivers,
  getDriver,
  addDriver,
  removeDriver,
  updateDriver,
  getSuppliers,
  getSuppliersByType,
  getSupplier,
  addSupplier,
  updateSupplier,
  removeSupplier,
  getVehicleTypes,
  getVehicleType,
  addVehicleType,
  removeVehicleType,
  updateVehicleType,
  getVehicles,
  getVehicleList,
  getVehicle,
  addVehicle,
  updateVehicle,
  removeVehicle,
  getBanks,
  getBank,
  addBank,
  updateBank,
  removeBank,
  getBankAccounts,
  getBankAccountList,
  getBankAccount,
  addBankAccount,
  updateBankAccount,
  removeBankAccount,
  getLastEmployee,
  getClientConsigneeForDrop,
  getClientConsignorsForDrop,
  getLastDriver,
  getRateListWithPagination,
  addToRateMaster,
  getCustomersForRateMaster,
  getforADDCustomersForRateMaster,
  getRateMasterById,
  updateRateMaster,
  getRateMasterByCustomer,
  removeRateMasterById,
  addTransactionPrefix,
  getTransactionPrefix,
};
