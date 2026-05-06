package controller

import (
	"strconv"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/dto"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
)

// GetAllDepartments 获取部门列表（分页），支持 org_id 过滤
func GetAllDepartments(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	orgIdStr := c.Query("organization_id")
	orgId := 0
	if orgIdStr != "" {
		orgId, _ = strconv.Atoi(orgIdStr)
	}
	depts, total, err := model.GetDepartmentsByOrgID(orgId, pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(depts)
	common.ApiSuccess(c, pageInfo)
}

// GetDepartmentTree 获取部门树形结构
func GetDepartmentTree(c *gin.Context) {
	orgIdStr := c.Query("organization_id")
	orgId, err := strconv.Atoi(orgIdStr)
	if err != nil || orgId <= 0 {
		common.ApiErrorMsg(c, "缺少组织 ID")
		return
	}
	tree, err := model.GetDepartmentTree(orgId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, tree)
}

// SearchDepartments 搜索部门
func SearchDepartments(c *gin.Context) {
	keyword := c.Query("keyword")
	orgIdStr := c.Query("organization_id")
	orgId := 0
	if orgIdStr != "" {
		orgId, _ = strconv.Atoi(orgIdStr)
	}
	pageInfo := common.GetPageQuery(c)
	depts, total, err := model.SearchDepartments(keyword, orgId, pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(depts)
	common.ApiSuccess(c, pageInfo)
}

// GetDepartment 根据 ID 获取部门
func GetDepartment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	dept, err := model.GetDepartmentByID(id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, dept)
}

// CreateDepartment 新建部门
func CreateDepartment(c *gin.Context) {
	var req dto.CreateDepartmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	if req.Name == "" {
		common.ApiErrorMsg(c, "部门名称不能为空")
		return
	}
	if req.Code == "" {
		common.ApiErrorMsg(c, "部门编码不能为空")
		return
	}
	if req.OrganizationId <= 0 {
		common.ApiErrorMsg(c, "缺少所属组织 ID")
		return
	}
	// 验证组织存在
	if _, err := model.GetOrganizationByID(req.OrganizationId); err != nil {
		common.ApiErrorMsg(c, "所属组织不存在")
		return
	}
	if dup, err := model.IsDeptCodeDuplicated(req.OrganizationId, 0, req.Code); err != nil {
		common.ApiError(c, err)
		return
	} else if dup {
		common.ApiErrorMsg(c, "部门编码在同一组织下已存在")
		return
	}
	status := 1
	if req.Status != nil {
		status = *req.Status
	}
	sort := 0
	if req.Sort != nil {
		sort = *req.Sort
	}
	dept := model.Department{
		OrganizationId: req.OrganizationId,
		ParentId:       req.ParentId,
		Name:           req.Name,
		Code:           req.Code,
		Description:    req.Description,
		Sort:           sort,
		Status:         status,
	}
	if err := dept.Insert(); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, &dept)
}

// UpdateDepartment 更新部门
func UpdateDepartment(c *gin.Context) {
	var req dto.UpdateDepartmentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	if req.Id == 0 {
		common.ApiErrorMsg(c, "缺少部门 ID")
		return
	}
	existing, err := model.GetDepartmentByID(req.Id)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	if req.Name != "" {
		existing.Name = req.Name
	}
	if req.Code != "" {
		if dup, err := model.IsDeptCodeDuplicated(existing.OrganizationId, req.Id, req.Code); err != nil {
			common.ApiError(c, err)
			return
		} else if dup {
			common.ApiErrorMsg(c, "部门编码在同一组织下已存在")
			return
		}
		existing.Code = req.Code
	}
	if req.Description != "" {
		existing.Description = req.Description
	}
	if req.ParentId != nil {
		if *req.ParentId == req.Id {
			common.ApiErrorMsg(c, "上级部门不能是自己")
			return
		}
		existing.ParentId = *req.ParentId
	}
	if req.Sort != nil {
		existing.Sort = *req.Sort
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

// DeleteDepartment 删除部门
func DeleteDepartment(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	model.DeleteUserDepartmentsByDeptId(id)
	if err := model.DeleteDepartmentByID(id); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

// GetDepartmentUsers 获取部门下的用户列表
func GetDepartmentUsers(c *gin.Context) {
	idStr := c.Param("id")
	deptId, err := strconv.Atoi(idStr)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo := common.GetPageQuery(c)
	users, total, err := model.GetDepartmentUsers(deptId, pageInfo.GetStartIdx(), pageInfo.GetPageSize())
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(users)
	common.ApiSuccess(c, pageInfo)
}

// AddDepartmentUsers 批量添加用户到部门
func AddDepartmentUsers(c *gin.Context) {
	idStr := c.Param("id")
	deptId, err := strconv.Atoi(idStr)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	var req dto.DepartmentUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.BatchAddUsersToDepartment(req.UserIds, deptId); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}

// RemoveDepartmentUsers 批量从部门中移除用户
func RemoveDepartmentUsers(c *gin.Context) {
	idStr := c.Param("id")
	deptId, err := strconv.Atoi(idStr)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	var req dto.DepartmentUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		common.ApiError(c, err)
		return
	}
	if err := model.BatchRemoveUsersFromDepartment(req.UserIds, deptId); err != nil {
		common.ApiError(c, err)
		return
	}
	common.ApiSuccess(c, nil)
}
