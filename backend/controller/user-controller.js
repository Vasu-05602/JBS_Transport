const jwt = require("jsonwebtoken");
const secrets = require("../secrets/secrets");
const User = require("../models/User.js");
const Employee = require("../models/Employee.js");
const Branch = require("../models/Branch.js");
const { ObjectId } = require("mongodb");
const pool = require('../database/db.js');

const signupAdminCtrl = (req, res) => {
  const user = new User({
    type: req.body.type,
    username: req.body.username,
    password: req.body.password,
    createdBy: "system",
  });

  User.findOne(
    {
      type: {
        $regex: getRegex(req.body.type?.trim?.()),
        $options: "i",
      },

      username: {
        $regex: getRegex(req.body.username?.trim?.()),
        $options: "i",
      },
    },
    (error, foundUser) => {
      if (error) {
        return next(error);
      }
      if (foundUser) {
        return res.status(200).json({
          message: "User already exist!",
        });
      }
      User.create(user, (error, data) => {
        if (error) {
          res.send(error);
        } else {
          res.send(data);
        }
      });
    }
  );
};

// const signupCtrl = (req, res, next) => {
//   const user = new User({
//     branch: req.body.branch,
//     type: req.body.type,
//     employee: req.body.employee,
//     username: req.body.username,
//     password: req.body.password,
//     createdBy: req.body.createdBy,
//   });

//   User.findOne(
//     {
//       username: {
//         $regex: getRegex(req.body.username?.trim?.()),
//         $options: "i",
//       },

//       employee: {
//         $regex: getRegex(req.body.employee?.trim?.()),
//         $options: "i",
//       },

//       branch: {
//         $regex: getRegex(req.body.branch),
//         $options: "i",
//       },

//       type: {
//         $regex: getRegex(req.body.type?.trim?.()),
//         $options: "i",
//       },
//     },
//     (error, foundUser) => {
//       if (error) {
//         return next(error);
//       }
//       if (foundUser) {
//         return res.status(200).json({
//           message: "User already exist!",
//         });
//       }
//       User.create(user, (error, data) => {
//         if (error) {
//           if (error.code === 11000) {
//             return res.status(200).json({
//               message: `User with username (${req.body.username}) already exist!`,
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


// const signupCtrl = async (req, res, next) => {
//   const { userBranches, type, employee, username, password } = req.body;
//   console.log(req.body);

//   try {
//     // Step 1: Check if the username already exists in the database
//     const [existingUser] = await pool.query(
//       'SELECT * FROM user WHERE username = ?',
//       [username.trim()]
//     );

//     if (existingUser.length > 0) {
//       // If a user with the same username exists, return an error message
//       return res.status(200).json({
//         message: 'Username already exists, please choose a different one.',
//       });
//     }

//     // Step 2: Insert the new user as the username is unique
//     const [result] = await pool.query(
//       ,
//       [userBranches, type.trim(), employee, username.trim(), password.trim()]
//     );

//     // Step 3: Return success message and the ID of the newly inserted user
//     return res.status(201).json({
//       message: `User ${username} added successfully.`,
//       inserted_id: result.insertId,  // The ID of the newly created user
//     });
//   } catch (error) {
//     console.error('Error during user creation:', error);
//     next(error);  // Forward the error to the error-handling middleware
//   }
// };



const transformPermissions = (permissions) => {
  const transformed = {};

  for (const [section, actions] of Object.entries(permissions)) {
    transformed[section] = {};
    for (const [action, permission] of Object.entries(actions)) {
      transformed[section][action] = {
        read: permission.read ? 1 : 0,
        write: permission.write ? 1 : 0
      };
    }
  }

  return transformed;
};

const permissions = {
  "Accounts": {
    "RouteBill": { "read": false, "write": false },
    "PaymentCollection": { "read": false, "write": false },
    "BankTransaction": { "read": false, "write": false },
    "BillRegister": { "read": false, "write": false },
    "BilledLRStatus": { "read": false, "write": false },
    "Branch": { "read": false, "write": false },
    "Customers": { "read": false, "write": false },
    "Driver": { "read": false, "write": false },
    "LRSRegister": { "read": false, "write": false },
    "LoadingTripsheet": { "read": false, "write": false },
    "LorryReceipt": { "read": false, "write": false },
    "MaterialInward": { "read": false, "write": false },
    "MaterialOutward": { "read": false, "write": false },
    "PATyreReport": { "read": false, "write": false },
    "Package": { "read": false, "write": false },
    "PaymentCollectionReport": { "read": false, "write": false },
    "PetrolReport": { "read": false, "write": false },
    "PettyCashRegister": { "read": false, "write": false },
    "Place": { "read": false, "write": false },
    "Supplier": { "read": false, "write": false },
    "Vehicle": { "read": false, "write": false },
    "VendorRegister": { "read": false, "write": false },
    "Voucher": { "read": false, "write": false }
  },
  "Admin": {
    "MoneyTransfer": { "read": false, "write": false },
    "Place": { "read": false, "write": false },
    "Article": { "read": false, "write": false },
    "Branch": { "read": false, "write": false },
    "Customers": { "read": false, "write": false },
    "Driver": { "read": false, "write": false },
    "Employee": { "read": false, "write": false },
    "GCNoteStatement": { "read": false, "write": false },
    "Kilometer": { "read": false, "write": false },
    "Package": { "read": false, "write": false },
    "RateMaster": { "read": false, "write": false },
    "Supplier": { "read": false, "write": false },
    "Tyre": { "read": false, "write": false },
    "TyreFitRemove": { "read": false, "write": false },
    "TyreOutward": { "read": false, "write": false },
    "Vehicle": { "read": false, "write": false },
    "VehicleTaxPay": { "read": false, "write": false },
    "VehicleType": { "read": false, "write": false }
  },
  "Sales/Purchase": {
    "LoadingSlip": { "read": false, "write": false },
    "TripSheet": { "read": false, "write": false },
    "BankTransaction1": { "read": false, "write": false },
    "Acknowledge": { "read": false, "write": false },
    "Add_FO_No": { "read": false, "write": false },
    "BankAccountMaster": { "read": false, "write": false },
    "BankMaster": { "read": false, "write": false },
    "BankPettyCash": { "read": false, "write": false },
    "CashMemo": { "read": false, "write": false },
    "ChallanReceiptReg": { "read": false, "write": false },
    "DebitNote": { "read": false, "write": false },
    "DeliveryStatus": { "read": false, "write": false },
    "DeliveryStatusReport": { "read": false, "write": false },
    "FundTransfer": { "read": false, "write": false },
    "InwardStatus": { "read": false, "write": false },
    "LRAcknowledge": { "read": false, "write": false },
    "LRStatus": { "read": false, "write": false },
    "LoadingSlipRegister": { "read": false, "write": false },
    "LocalMemo": { "read": false, "write": false },
    "LorryReceiptReg": { "read": false, "write": false },
    "MaterialInwardRegisterReport": { "read": false, "write": false },
    "MaterialOutwardRegReport": { "read": false, "write": false },
    "PaymentAdvice": { "read": false, "write": false },
    "PaymentAdvicePetrol": { "read": false, "write": false },
    "PendingCheque": { "read": false, "write": false },
    "PetrolPump": { "read": false, "write": false },
    "PetrolPump1": { "read": false, "write": false },
    "RateMasterList": { "read": false, "write": false },
    "StockLRRegister": { "read": false, "write": false },
    "StockReport": { "read": false, "write": false },
    "TyreSupplier": { "read": false, "write": false },
    "TyreSupplierList": { "read": false, "write": false }
  },
  "User": {
    "RoleMaster": { "read": false, "write": false },
    "PendingRequest": { "read": false, "write": false },
    "ChangePassword": { "read": false, "write": false },
    "Designation": { "read": false, "write": false },
    "UserActivation": { "read": false, "write": false },
    "UserRegister": { "read": false, "write": false },
    "clientuserConfiguration": { "read": false, "write": false },
  }
};

const signupCtrl = async (req, res, next) => {
  const { employee, username, password, userBranches, type } = req.body;
  const transformedPermissions = transformPermissions(permissions);



  try {
    const query = 'INSERT INTO user (branch, usertype, employee_id, username, password) VALUES (?, ?, ?, ?, ?)';
    const [result] = await pool.query(query, [userBranches, type, employee,username, password]);

    // if (!result || !result[0][0]) {
    //   return res.status(200).json({ message: 'Something went wrong' });
    // }
    // const message = result[0][0][0].message;
    // if (message === 'User Already Exist!') {
    //   return res.status(200).json({ message: message });
    // }
    const userId = result.insertId;


    for (const role in transformedPermissions) {
      const rolePermissions = transformedPermissions[role];

      for (const permission in rolePermissions) {
        const { read, write } = rolePermissions[permission];

        const insertPermissionQuery = 'INSERT INTO user_permissions (user_id, permission, status, edit) VALUES (?, ?, ?, ?)';

        await pool.query(insertPermissionQuery, [userId, permission, read, write]);
      }
    }

    return res.status(200).json('User added successfully with permissions');
  } catch (error) {
    console.log('Error in adding employee', error);
    return res.status(500).json(error);
  }
};



// const getUsers = (req, res) => {
//   // User.find({ active: true }, (error, users) => {
//   //   if (error) {
//   //     return res.status(200).json({
//   //       message: "Error fetching users!",
//   //     });
//   //   } else {
//   //     const updatedUsers = [];
//   //     users.forEach((user) => {
//   //       if (user && user.type && user.type.toLowerCase() !== "superadmin") {
//   //         const updatedUser = {
//   //           branch: user.branch,
//   //           employee: user.employee,
//   //           type: user.type,
//   //           username: user.username,
//   //           id: user._id,
//   //           permissions: user.permissions,
//   //         };
//   //         updatedUsers.push(updatedUser);
//   //       }
//   //     });
//   //     res.json(updatedUsers);
//   //   }
//   // });



//   User.aggregate([
//     { $match: { active: true } },
//     { $sort: { createdAt: -1 } },
//     {
//       $addFields: {
//         convertedBranchId: { $toObjectId: "$branch" },
//       },
//     },
//     {
//       $addFields: {
//         convertedEmployeeId: { $toObjectId: "$employee" },
//       },
//     },
//     {
//       $lookup: {
//         from: "branch",
//         localField: "convertedBranchId",
//         foreignField: "_id",
//         as: "Branch",
//       },
//     },
//     {
//       $lookup: {
//         from: "employee",
//         localField: "convertedEmployeeId",
//         foreignField: "_id",
//         as: "Employee",
//       },
//     },
//   ]).exec(function (error, users) {
//     if (error) {
//       return res.status(200).json({
//         message: "Error fetching users!",
//       });
//     } else {
//       const updatedUsers = [];
//       users.forEach((user) => {
//         if (user && user.type && user.type.toLowerCase() !== "superadmin") {
//           const updatedUser = {
//             branch: user.Branch[0]?.name || "",
//             employee: user.Employee[0]?.name || "",
//             type: user.type,
//             username: user.username,
//             id: user._id,
//             permissions: user.permissions,
//           };
//           updatedUsers.push(updatedUser);
//         }
//       });
//       res.json(updatedUsers);
//     }
//   });
// };

const getUsers = async (req, res) => {
  try {
    const query = 'CALL listusers()';  
    const [results] = await pool.query(query); 
    return res.json(results[0]); 
  } catch (err) {
    console.error('Error executing query:', err);
    return res.status(500).send('Server error');
  }
};




const userRegister = (req, res) => {
  User.aggregate([
    { $sort: { createdAt: -1 } },
    {
      $addFields: {
        convertedBranchId: { $toObjectId: "$branch" },
      },
    },
    {
      $addFields: {
        convertedEmployeeId: { $toObjectId: "$employee" },
      },
    },
    {
      $addFields: {
        convertedCreatedById: {
          $cond: {
            if: {
              $ne: ["$createdBy", "system"],
            },
            then: { $toObjectId: "$createdBy" },
            else: null,
          },
        },
      },
    },
    {
      $lookup: {
        from: "branch",
        localField: "convertedBranchId",
        foreignField: "_id",
        as: "Branch",
      },
    },
    {
      $lookup: {
        from: "employee",
        localField: "convertedEmployeeId",
        foreignField: "_id",
        as: "Employee",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "convertedCreatedById",
        foreignField: "_id",
        as: "User",
      },
    },
  ]).exec(function (error, users) {
    if (error) {
      return res.status(200).json({
        message: "Error fetching users!",
      });
    } else {
      const updatedUsers = [];
      users.forEach((user, index) => {
        if (user.type.toLowerCase() !== "superadmin") {
          const updatedUser = {
            branch: user.Branch[0]?.name || "",
            employee: user.Employee[0]?.name || "",
            username: user.username,
            active: user.active,
            createdBy: user.User[0]?.username,
            createdAt: getFormattedDate(user.createdAt),
            id: index + 1,
          };
          updatedUsers.push(updatedUser);
        }
      });
      res.json(updatedUsers);
    }
  });
};

// const getUser = (req, res, next) => {
//   User.aggregate([
//     { $match: { _id: ObjectId(req.params.id) } },
//     {
//       $lookup: {
//         from: "branch",
//         localField: "userBranches",
//         foreignField: "_id",
//         as: "userBranches",
//       },
//     },
//   ]).exec((error, data) => {
//     if (error) {
//       res.json({ message: error.message });
//     } else {
//       res.json(data[0]);
//     }
//   });
// };

const getUser = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Query to get the user and the associated branch details
    const query = `
      SELECT u.*, b.*
      FROM user u
      LEFT JOIN branch b ON u.branch = b.branch_id
      WHERE u.id = ?
    `;
    
    // Execute the query with the provided user ID
    const [rows] = await pool.query(query, [id]);

    if (rows.length === 0) {
      // If no user is found, return a 404 response
      return res.status(404).json({ message: 'User not found' });
    }

    // Assuming the user has one branch (adjust if it's a many-to-many relationship)
    const userData = rows[0];  // Get the first row of results (user with branch data)

    // Query to get user permissions
    const permissionsQuery = 'SELECT * FROM user_permissions WHERE user_id = ?';
    const [permissionsResult] = await pool.query(permissionsQuery, [id]);

    // Initialize the permissions structure
    let permissionsFormatted = {
      Admin: {},
      'Sales/Purchase': {},
      Accounts: {},
      User: {},
    };

    // Helper function to map permission name to its category
    const mapPermissionToCategory = (permission) => {
      const adminPermissions = ["MoneyTransfer", "Place", "Article", "Branch", "Customers", "Driver",
        "Employee", "GCNoteStatement", "Kilometer", "Package", "RateMaster", "Supplier", "Tyre", "TyreFitRemove",
        "TyreOutward", "Vehicle", "VehicleTaxPay", "VehicleType"];
      const salesPurchasePermissions = ["LoadingSlip", "TripSheet", "BankTransaction1", "Acknowledge", "Add_FO_No", "BankAccountMaster",
        "BankMaster", "BankPettyCash", "CashMemo", "ChallanReceiptReg", "DebitNote", "DeliveryStatus", "DeliveryStatusReport",
        "FundTransfer", "InwardStatus", "LRAcknowledge", "LRStatus", "LoadingSlipRegister", "LocalMemo", "LorryReceiptReg",
        "MaterialInwardRegisterReport", "MaterialOutwardRegReport", "PaymentAdvice", "PaymentAdvicePetrol", "PendingCheque",
        "PetrolPump", "PetrolPump1", "RateMasterList", "StockLRRegister", "StockReport", "TripSheet", "TyreSupplier",
        "TyreSupplierList"];
      const accountsPermissions = ["RouteBill", "PaymentCollection", "BankTransaction", "BillRegister",
        "BilledLRStatus", "Branch", "Customers", "Driver", "LRSRegister", "LoadingTripsheet", "LorryReceipt",
        "MaterialInward", "MaterialOutward", "PATyreReport", "Package", "PaymentCollectionReport", "PetrolReport",
        "PettyCashRegister", "Place", "Supplier", "Vehicle", "VendorRegister", "Voucher"];
      const userPermissions = ["RoleMaster", "PendingRequest", "ChangePassword", "Designation", "UserActivation", "UserRegister","clientuserConfiguration"];

      if (adminPermissions.includes(permission)) return 'Admin';
      if (salesPurchasePermissions.includes(permission)) return 'Sales/Purchase';
      if (accountsPermissions.includes(permission)) return 'Accounts';
      if (userPermissions.includes(permission)) return 'User';

      return null;
    };

    // Format the permissions into the desired structure
    permissionsResult.forEach((permission) => {
      const category = mapPermissionToCategory(permission.permission);
      if (category) {
        permissionsFormatted[category][permission.permission] = {
          read: permission.status === '1' ? true : false,
          write: permission.edit === '1' ? true : false,
        };
      }
    });

    // Add the formatted permissions to the userData
    userData.permissions = permissionsFormatted;

    // Return the user data with permissions
    return res.status(200).json(userData);

  } catch (error) {
    console.error('Error fetching user:', error);
    next(error);  // Forward the error to the error-handling middleware
  }
};



// const getUsersByBranch = (req, res, next) => {
//   // User.find({ branch: req.params.id, active: true }, (error, users) => {
//   //   if (error) {
//   //     return res.status(200).json({
//   //       message: "Error fetching users!",
//   //     });
//   //   } else {
//   //     const updatedUsers = [];
//   //     users.forEach((user) => {
//   //       const updatedUser = {
//   //         branch: user.branch,
//   //         employee: user.employee,
//   //         type: user.type,
//   //         username: user.username,
//   //         id: user._id,
//   //         permissions: user.permissions,
//   //       };
//   //       updatedUsers.push(updatedUser);
//   //     });
//   //     res.json(updatedUsers);
//   //   }
//   // });

//   User.aggregate([
//     { $match: { active: true, branch: req.params.id } },
//     {
//       $addFields: {
//         convertedBranchId: { $toObjectId: "$branch" },
//       },
//     },
//     {
//       $addFields: {
//         convertedEmployeeId: { $toObjectId: "$employee" },
//       },
//     },
//     {
//       $lookup: {
//         from: "branch",
//         localField: "convertedBranchId",
//         foreignField: "_id",
//         as: "Branch",
//       },
//     },
//     {
//       $lookup: {
//         from: "employee",
//         localField: "convertedEmployeeId",
//         foreignField: "_id",
//         as: "Employee",
//       },
//     },
//   ]).exec(function (error, users) {
//     if (error) {
//       return res.status(200).json({
//         message: "Error fetching users!",
//       });
//     } else {
//       const updatedUsers = [];
//       users.forEach((user) => {
//         if (user && user.type && user.type.toLowerCase() !== "superadmin") {
//           const updatedUser = {
//             branch: user.Branch[0]?.name || "",
//             employee: user.Employee[0] || {},
//             type: user.type,
//             username: user.username,
//             id: user._id,
//             permissions: user.permissions,
//           };
//           updatedUsers.push(updatedUser);
//         }
//       });
//       res.json(updatedUsers);
//     }
//   });
// };


const getUsersByBranch = async (req, res, next) => {
  const branchId = req.params.id;
  const query = `
    SELECT
      u.id AS user_id,
      u.username,    
      u.usertype    
    FROM user u
    LEFT JOIN branch b ON u.branch = b.branch_id
    WHERE u.branch = ?`;   // No need to join 'employee' if you don't need employee data

  try {
    // Await the result from the query
    const [results] = await pool.query(query, [branchId]);

    // Return the filtered and formatted result
    res.json(results);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      message: 'Error fetching users!',
    });
  }
};


const updateUserPermissions = async (req, res, next) => {
  const { id, permissions } = req.body;
  const transformedPermissions = transformPermissions(permissions);

  try {
    for (const role in transformedPermissions) {
      const rolePermissions = transformedPermissions[role];

      for (const permission in rolePermissions) {
        const { read, write } = rolePermissions[permission];

        const updatePermissionQuery = `
          UPDATE user_permissions
          SET status = ?, edit = ?
          WHERE user_id = ? AND permission = ?
        `;

        const result = await pool.query(updatePermissionQuery, [read, write, id, permission]);

      }
    }

    return res.status(200).json({ Data: "Permissions updated successfully" });
  } catch (error) {
    console.error("Error updating permissions:", error);
    return res.status(500).json({ message: "Error updating permissions" });
  }
};

// const removeUser = (req, res, next) => {
//   if (!req.params.id) {
//     return res.status(200).json({ message: "User ID is required!" });
//   }

//   User.findByIdAndUpdate(
//     req.params.id,
//     {
//       $set: {
//         active: false,
//         updatedBy: req.body.updatedBy,
//       },
//     },
//     (error, data) => {
//       if (error) {
//         res.status(200).json({ message: error.message });
//       } else {
//         res.json({ id: data._id });
//       }
//     }
//   );
// };


const removeUser = async (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ message: "User ID is required!" });
  }

  const deletePermissionsQuery = 'DELETE FROM `user_permissions` WHERE `user_id` = ?';
  const deleteUserQuery = 'DELETE FROM `user` WHERE `id` = ?';

  try {
    const [deletePermissionsResult] = await pool.query(deletePermissionsQuery, [userId]);
    const [deleteUserResult] = await pool.query(deleteUserQuery, [userId]);
    if (deletePermissionsResult.affectedRows > 0 && deleteUserResult.affectedRows > 0) {
      return res.json({ message: "User and permissions deleted successfully", id: userId });
    } else {
      return res.status(404).json({ message: "User or permissions not found" });
    }
  } catch (error) {
    console.error("Error during MySQL query:", error);
    return res.status(500).json({ message: "Database query failed", error: error.message });
  }
};



// const updateUser = (req, res, next) => {
//   const id = req.body.id;
// console.log(req.body)
//   User.findOne(
//     {
//       username: {
//         $regex: getRegex(req.body.username?.trim?.()),
//         $options: "i",
//       },
//       employee: {
//         $regex: getRegex(req.body.employee?.trim?.()),
//         $options: "i",
//       },
//       branch: {
//         $regex: getRegex(req.body.branch),
//         $options: "i",
//       },

//       type: {
//         $regex: getRegex(req.body.type?.trim?.()),
//         $options: "i",
//       },
//       _id: { $ne: _id },
//     },
//     (error, foundUser) => {
//       if (error) {
//         return next(error);
//       }
//       if (foundUser) {
//         return res.status(200).json({
//           message: "User already exist!",
//         });
//       }
//       User.findOneAndUpdate(
//         { _id },
//         {
//           $set: {
//             permissions: req.body.permissions,
//             branch: req.body.branch,
//             password: req.body.password,
//             type: req.body.type,
//             employee: req.body.employee,
//             updatedBy: req.body.updatedBy,
//           },
//         },
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


const updateUser = async (req, res, next) => {
  try {
    if (!req.body.id) {
      return res.status(400).json({ message: 'ID is required' });
    }
    const username = req.body.username ? req.body.username.trim() : '';
    const password = req.body.password ? req.body.password.trim() : '';
    const employee = req.body.employee;
    const branch = req.body.branch;
    const usertype = req.body.type ? req.body.type.trim() : '';

    const updateQuery = `
      UPDATE user
      SET 
        username = ?,
        password = ?,                       
        employee_id = ?,
        branch = ?, 
        usertype = ?
      WHERE id = ?;
    `;

    const updateParams = [
      username,
      password,
      employee,
      branch,
      usertype,
      req.body.id,
    ];

    const [updateResults] = await pool.query(updateQuery, updateParams);

    return res.status(200).json({
      data: updateResults,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: error.message });
  }
};


const loginCtrl = async (req, res, next) => {
  try {


    const { username, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM user WHERE username = ?', [username.trim()]);
    if (rows.length === 0) {
      return res.status(200).json({ message: 'User not found!' });
    }
    const foundUser = rows[0];
    if (password !== foundUser.password) {
      return res.status(200).json({ message: 'Wrong password!' });
    }

    // Generate JWT token without the type field
    const token = jwt.sign(
      {
        username: foundUser.username,
        userId: foundUser.id, // Assuming `id` is the primary key
      },
      secrets.authKey
    );

    const updatedUser = { ...foundUser, token };
    delete updatedUser.password;


    const permissionsQuery = 'SELECT * FROM user_permissions WHERE user_id = ?';
    const [permissionsResult] = await pool.query(permissionsQuery, [foundUser.id]);

    // Initialize the permissions structure
    let permissionsFormatted = {
      Admin: {},
      'Sales/Purchase': {},
      Accounts: {},
      User: {},
    };

    // Helper function to map permission name to its category
    const mapPermissionToCategory = (permission) => {
      const adminPermissions = ["MoneyTransfer", "Place", "Article", "Branch", "Customers", "Driver",
        "Employee", "GCNoteStatement", "Kilometer", "Package", "RateMaster", "Supplier", "Tyre", "TyreFitRemove",
        "TyreOutward", "Vehicle", "VehicleTaxPay", "VehicleType"];
      const salesPurchasePermissions = ["TripSheet", "BankTransaction1", "Acknowledge", "Add_FO_No", "BankAccountMaster",
        "BankMaster", "BankPettyCash", "CashMemo", "ChallanReceiptReg", "DebitNote", "DeliveryStatus", "DeliveryStatusReport",
        "FundTransfer", "InwardStatus", "LRAcknowledge", "LRStatus", "LoadingSlipRegister", "LocalMemo", "LorryReceiptReg",
        "MaterialInwardRegisterReport", "MaterialOutwardRegReport", "PaymentAdvice", "PaymentAdvicePetrol", "PendingCheque",
        "PetrolPump", "PetrolPump1", "RateMasterList", "StockLRRegister", "StockReport", "TripSheet", "TyreSupplier",
        "TyreSupplierList"];
      const accountsPermissions = ["RouteBill", "PaymentCollection", "BankTransaction", "BillRegister",
        "BilledLRStatus", "Branch", "Customers", "Driver", "LRSRegister", "LoadingSlip", "LoadingTripsheet", "LorryReceipt",
        "MaterialInward", "MaterialOutward", "PATyreReport", "Package", "PaymentCollectionReport", "PetrolReport",
        "PettyCashRegister", "Place", "Supplier", "Vehicle", "VendorRegister", "Voucher"];
      const userPermissions = ["RoleMaster", "PendingRequest", "ChangePassword", "Designation", "UserActivation", "UserRegister","clientuserConfiguration"];

      if (adminPermissions.includes(permission)) return 'Admin';
      if (salesPurchasePermissions.includes(permission)) return 'Sales/Purchase';
      if (accountsPermissions.includes(permission)) return 'Accounts';
      if (userPermissions.includes(permission)) return 'User';

      return null;
    };

    // Format the permissions into the desired structure
    permissionsResult.forEach((permission) => {
      const category = mapPermissionToCategory(permission.permission);
      if (category) {
        permissionsFormatted[category][permission.permission] = {
          read: permission.status === '1' ? true : false,
          write: permission.edit === '1' ? true : false,
        };
      }
    });

    // Add the formatted permissions to the userData
    updatedUser.permissions = permissionsFormatted;

    return res.json(updatedUser);

  } catch (error) {
    console.error('Error during login:', error);
    return res.json(error);
  }
};

// const getSearchedUsers = (req, res, next) => {
//   if (!req.body.search) {
//     return getUsers(req, res, next);
//   }
//   const expression = new RegExp(req.body.search);
//   User.aggregate([
//     { $sort: { createdAt: -1 } },
//     {
//       $addFields: {
//         convertedBranchId: { $toObjectId: "$branch" },
//       },
//     },
//     {
//       $addFields: {
//         convertedEmployeeId: { $toObjectId: "$employee" },
//       },
//     },
//     {
//       $lookup: {
//         from: "branch",
//         localField: "convertedBranchId",
//         foreignField: "_id",
//         as: "Branch",
//       },
//     },
//     {
//       $lookup: {
//         from: "employee",
//         localField: "convertedEmployeeId",
//         foreignField: "_id",
//         as: "Employee",
//       },
//     },
//     { $unwind: { path: "$Branch", preserveNullAndEmptyArrays: true } },
//     { $unwind: { path: "$Employee", preserveNullAndEmptyArrays: true } },
//     {
//       $match: {
//         active: true,
//         $or: [
//           {
//             ["Branch.name"]: {
//               $regex: expression,
//               $options: "i",
//             },
//           },
//           {
//             ["Employee.name"]: {
//               $regex: expression,
//               $options: "i",
//             },
//           },
//           {
//             type: {
//               $regex: expression,
//               $options: "i",
//             },
//           },
//           {
//             username: {
//               $regex: expression,
//               $options: "i",
//             },
//           },
//         ],
//       },
//     },
//   ]).exec(function (error, users) {
//     if (error) {
//       return res.status(200).json({
//         message: "Error fetching users!",
//       });
//     } else {
//       const updatedUsers = [];
//       users.forEach((user) => {
//         if (user && user.type && user.type.toLowerCase() !== "superadmin") {
//           const updatedUser = {
//             branch: user.Branch?.name || "",
//             employee: user.Employee?.name || "",
//             type: user.type,
//             username: user.username,
//             id: user._id,
//             permissions: user.permissions,
//           };
//           updatedUsers.push(updatedUser);
//         }
//       });
//       res.json(updatedUsers);
//     }
//   });
// };
const getSearchedUsers = async (req, res, next) => {
  try {
    const searchQuery = req.body.search ? req.body.search.trim() : '';
    if (!searchQuery) {
      return getUsers(req, res, next);
    }

    const searchPattern = `%${searchQuery}%`;

    const sql = `
      SELECT 
        u.id, 
        u.username, 
        u.usertype, 
        b.branch_name AS branch,  
        e.employee_name AS employee 
      FROM user u
      LEFT JOIN branch b ON u.branch = b.branch_id    
      LEFT JOIN employee e ON u.employee_id = e.emp_id
      WHERE (
          b.branch_name LIKE ? OR      
          e.employee_name LIKE ? OR     
          u.usertype LIKE ? OR       
          u.username LIKE ?         
      )
      ORDER BY u.id DESC;
    `;

    const [rows] = await pool.query(sql, [searchPattern, searchPattern, searchPattern, searchPattern]);
    const updatedUsers = rows
      .filter(user => user.usertype.toLowerCase() !== 'superadmin')
      .map(user => ({
        id: user.id,
        username: user.username,
        usertype: user.usertype,
        branch_name: user.branch || '',
        employee_name: user.employee || ''
      }));

   return res.json(updatedUsers);

  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({ message: "Error fetching users!" });
  }
};
const getClientUsersByType = async (req, res, next) => {
  try {
    const sql = `
      SELECT 
        u.id, 
        u.username, 
        u.usertype
      FROM user u
      WHERE u.usertype = 'ClientUser'  
      ORDER BY u.id DESC;
    `;
    const [rows] = await pool.query(sql);
    return res.json(rows);

  } catch (error) {
    console.error("Error fetching client users:", error);
    return res.status(500).json({ message: "Error fetching client users!" });
  }
};

const getRegex = (str) => `^${str}$`;
const getFormattedDate = (date) => {
  const day = new Date(date)?.getDate();
  const month = new Date(date)?.getMonth() + 1;
  const year = new Date(date)?.getFullYear();
  return `${("0" + day).slice(-2)}-${("0" + month).slice(-2)}-${year}`;
};

const addClientUserConfiguration = async (req, res) => {
  const { configurations } = req.body;

  
  try {
    const clientUserIDs = [...new Set(configurations.map(config => config.clientUserID))];
    for (const clientUserID of clientUserIDs) {
      await pool.query(
        `DELETE FROM clientuserconfiguration WHERE clientUserID = ?`,
        [clientUserID]
      );
    }
    for (const config of configurations) {
      const { clientUserID, consignorId, consigneeId } = config;
      const consignorIdInt = consignorId ? parseInt(consignorId, 10) : null;
      const consigneeIdInt = consigneeId ? parseInt(consigneeId, 10) : null;

      await pool.query(
        `CALL addclientuserconfiguration(?, ?, ?)`,
        [clientUserID, consignorIdInt, consigneeIdInt]
      );
    }

    return res.status(200).json({ message: 'Client user configuration(s) added successfully!' });
  } catch (error) {
    console.error("Error adding client user configuration:", error);
    return res.status(500).json({ message: "Error adding client user configuration!" });
  }
};



const getAllConsignorConsigneeByClientUserId = async (req, res) => {
  const { clientUserID } = req.params;  
  try {
    const [result] = await pool.query(
      `CALL GetAllConsignorConsigneeByClientUserId(?)`, 
      [clientUserID]
    );
    if (result && result.length > 0) {
      const formattedData = result[0].map((row, index) => ({
        id: index + 1,
        consignorName: row.Consignor_Name,  
        consigneeName: row.Consignee_Name,  
        clientUserID: row.ClientUserId,
        consignorId: row.Consignor_Id,
        consigneeId: row.Consignee_Id,
      }));  
      return res.status(200).json(formattedData);  
    } else {
      return res.status(404).json([]);  
    }
  } catch (error) {
    console.error("Error fetching consignor and consignee details:", error);
    return res.status(500).json([]); 
  }
};




module.exports = {
  signupAdminCtrl,
  signupCtrl,
  loginCtrl,
  getUsers,
  updateUserPermissions,
  removeUser,
  getUser,
  getUsersByBranch,
  userRegister,
  updateUser,
  getSearchedUsers,
  getClientUsersByType,
  addClientUserConfiguration,
  getAllConsignorConsigneeByClientUserId
};
