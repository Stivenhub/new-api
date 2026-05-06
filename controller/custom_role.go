package controller

import (
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
)

// GetAllCustomRoles 获取角色列表（分页）
func GetAllCustomRoles(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	roles, total, err := model.GetAllCustomRoles(pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(roles)
	common.ApiSuccess(c, pageInfo)
}

// SearchCustomRoles 搜索角色
func SearchCustomRoles(c *gin.Context) {
	keyword := c.Query("keyword")
	pageInfo := common.GetPageQuery(c)
	roles, total, err := model.SearchCustomRoles(keyword, pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(roles)
	common.ApiSuccess(c, pageInfo)
}

// GetCustomRole 根据 ID 获取角色
func GetCustomRole(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	role, err := model.GetCustomRoleByID(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, role)
}

// CreateCustomRole 新建角色
func CreateCustomRole(c *gin.Context) {
	var req dto.CreateCustomRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	if req.Name == "" {
		common.ApiErrorMsg(c, "角色名称不能为空")
		return
	}
	if req.Code == "" {
		common.ApiErrorMsg(c, "角色编码不能为空")
		return
	}
	if dup, err := model.IsCustomRoleCodeDuplicated(0, req.Code); err != nil {
		common.ApiError(c, err)
		return
	} else if dup {
		common.ApiErrorMsg(c, "角色编码已存在")
		return
	}
	status := 1
	if req.Status != nil {
		status = *req.Status
	}
	role := model.CustomRole{
		Name:        req.Name,
		Code:        req.Code,
		Description: req.Description,
		Status:      status,
	}
	if err := role.Insert(); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, &role)
}

// UpdateCustomRole 更新角色
func UpdateCustomRole(c *gin.Context) {
	var req dto.UpdateCustomRoleRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	if req.Id == 0 {
		common.ApiErrorMsg(c, "缺少角色 ID")
		return
	}
	existing, err := model.GetCustomRoleByID(req.Id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if req.Name != "" {
		existing.Name = req.Name
	}
	if req.Code != "" {
		if dup, err := model.IsCustomRoleCodeDuplicated(req.Id, req.Code); err != nil {
			common.ApiError(c, err)
			return
		} else if dup {
			common.ApiErrorMsg(c, "角色编码已存在")
			return
		}
		existing.Code = req.Code
	}
	if req.Description != "" {
		existing.Description = req.Description
	}
	if req.Status != nil {
		existing.Status = *req.Status
	}
	if err := existing.Update(); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, existing)
}

// DeleteCustomRole 删除角色
func DeleteCustomRole(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	model.DeleteUserCustomRolesByRoleId(id)
	if err := model.DeleteCustomRoleByID(id); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

// GetCustomRoleUsers 获取角色下的用户列表
func GetCustomRoleUsers(c *gin.Context) {
	idStr := c.Param("id")
	roleId, err := strconv.Atoi(idStr)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo := common.GetPageQuery(c)
	users, total, err := model.GetCustomRoleUsers(roleId, pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(users)
	common.ApiSuccess(c, pageInfo)
}

// AddCustomRoleUsers 批量添加用户到角色
func AddCustomRoleUsers(c *gin.Context) {
	idStr := c.Param("id")
	roleId, err := strconv.Atoi(idStr)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	var req dto.CustomRoleUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.BatchAddUsersToCustomRole(req.UserIds, roleId); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

// RemoveCustomRoleUsers 批量从角色中移除用户
func RemoveCustomRoleUsers(c *gin.Context) {
	idStr := c.Param("id")
	roleId, err := strconv.Atoi(idStr)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	var req dto.CustomRoleUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.BatchRemoveUsersFromCustomRole(req.UserIds, roleId); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

// GetUserAssociations 获取用户的组织/部门/角色关联
func GetUserAssociations(c *gin.Context) {
	idStr := c.Param("id")
	userId, err := strconv.Atoi(idStr)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	orgIds, err := model.GetUserOrganizationIds(userId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	deptIds, err := model.GetUserDepartmentIds(userId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	roleIds, err := model.GetUserCustomRoleIds(userId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	resp := dto.UserAssociationsResponse{
		OrganizationIds: orgIds,
		DepartmentIds:   deptIds,
		CustomRoleIds:   roleIds,
	}
	if resp.OrganizationIds == nil {
		resp.OrganizationIds = []int{}
	}
	if resp.DepartmentIds == nil {
		resp.DepartmentIds = []int{}
	}
	if resp.CustomRoleIds == nil {
		resp.CustomRoleIds = []int{}
	}
	common.ApiSuccess(c, resp)
}

// UpdateUserAssociations 更新用户的组织/部门/角色关联
func UpdateUserAssociations(c *gin.Context) {
	idStr := c.Param("id")
	userId, err := strconv.Atoi(idStr)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	var req dto.UserAssociationsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.SetupUserOrganizations(userId, req.OrganizationIds); err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.SetupUserDepartments(userId, req.DepartmentIds); err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.SetupUserCustomRoles(userId, req.CustomRoleIds); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}
